var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/reviews.js
var HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var j = /* @__PURE__ */ __name((status, obj) => new Response(JSON.stringify(obj), { status, headers: HEADERS }), "j");
var okBody = { ok: true };
async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  if (url.searchParams.get("debug") === "1") {
    return j(200, {
      ok: true,
      debug: {
        hasKv: !!env.REVIEWS,
        hasToken: typeof env.REVIEWS_ADMIN_TOKEN === "string",
        tokenLen: typeof env.REVIEWS_ADMIN_TOKEN === "string" ? env.REVIEWS_ADMIN_TOKEN.length : -1
      }
    });
  }
  try {
    const list = await env.REVIEWS.list({ prefix: "review:" });
    const out = [];
    for (const key of list.keys) {
      try {
        const rec = JSON.parse(await env.REVIEWS.get(key.name));
        if (rec && rec.status === "approved") {
          out.push({ id: key.name.replace("review:", ""), name: rec.name, country: rec.country, rating: rec.rating, text: rec.text, photo: rec.photo || null, createdAt: rec.createdAt });
        }
      } catch {
      }
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return j(200, { ok: true, reviews: out });
  } catch (e) {
    return j(500, { ok: false, error: String(e && e.message || e) });
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return j(400, { ok: false, error: "invalid JSON" });
  }
  if (!body || typeof body !== "object") return j(400, { ok: false, error: "bad body" });
  if (body.action) {
    if (!body.token || body.token !== env.REVIEWS_ADMIN_TOKEN) return j(403, { ok: false, error: "unauthorized" });
    if (!body.id) return j(400, { ok: false, error: "id required" });
    const key = "review:" + body.id;
    if (body.action === "approve") {
      const raw = await env.REVIEWS.get(key);
      if (!raw) return j(404, { ok: false, error: "not found" });
      const rec2 = JSON.parse(raw);
      rec2.status = "approved";
      await env.REVIEWS.put(key, JSON.stringify(rec2));
      return j(200, okBody);
    }
    if (body.action === "delete") {
      await env.REVIEWS.delete(key);
      return j(200, okBody);
    }
    return j(400, { ok: false, error: "unknown action" });
  }
  const name = String(body.name || "").trim().slice(0, 60);
  const country = String(body.country || "").trim().slice(0, 60);
  const text = String(body.text || "").trim().slice(0, 2e3);
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
  const photo = typeof body.photo === "string" && body.photo.startsWith("data:image") ? body.photo.slice(0, 4e5) : null;
  if (!name || !text) return j(400, { ok: false, error: "name and review text are required" });
  const id = crypto.randomUUID();
  const rec = { name, country, rating, text, photo, status: "pending", createdAt: Date.now() };
  await env.REVIEWS.put("review:" + id, JSON.stringify(rec));
  return j(200, { ok: true, id });
}
__name(onRequestPost, "onRequestPost");

// api/track.ts
async function onRequest(context) {
  const url = new URL(context.request.url);
  const no = url.searchParams.get("no") || "";
  const carrier = url.searchParams.get("carrier") || "auto";
  if (!no) {
    return json({ error: "missing tracking number" }, 400);
  }
  const provider = context.env.TRACKING_PROVIDER || "17track";
  try {
    if (provider === "17track") return await track17(context.env, no);
    if (provider === "kd100") return await kd100(context.env, no);
    return await trackingMore(context.env, no);
  } catch (err) {
    return json({ error: "tracking proxy failed", detail: String(err) }, 502);
  }
}
__name(onRequest, "onRequest");
async function track17(env, no) {
  const key = env["17TRACK_KEY"];
  if (!key) return json({ error: "17TRACK_KEY not configured", demo: true }, 503);
  const BASE = "https://api.17track.net/track/v2.4";
  const hdrs = { "Content-Type": "application/json", "17token": key };
  await fetch(`${BASE}/register`, {
    method: "POST",
    headers: hdrs,
    body: JSON.stringify([{ number: no, auto_detection: true }])
  }).catch(() => {
  });
  const res = await fetch(`${BASE}/gettrackinfo`, {
    method: "POST",
    headers: hdrs,
    body: JSON.stringify([{ number: no }])
  });
  const data = await res.json();
  if (data?.code !== 0) {
    return json({ error: data?.message || "17TRACK api error", code: data?.code, demo: false }, 200);
  }
  const item = (data?.data?.accepted || data?.data || [])[0] || {};
  const ti = item?.track_info || {};
  const latest = ti?.latest_status || {};
  const providers = Array.isArray(ti?.tracking?.providers) ? ti.tracking.providers : [];
  const provider = providers[0]?.provider || {};
  const rawEvents = providers.flatMap?.((p) => p?.events || []) || [];
  const events = rawEvents.map((e) => {
    const loc = e.location;
    const place = typeof loc === "object" && loc ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ") : typeof loc === "string" && loc ? loc : e.location_raw || "";
    return {
      time: fmt17Time(e.time_iso || e.time || e.datetime || ""),
      location: place,
      code: map17Event(String(e.status_code ?? e.status ?? "")),
      description: e.description || e.text || ""
    };
  });
  const rawStatus = String(latest?.sub_status || latest?.status || "Pending");
  const st = map17Status(rawStatus);
  return json({
    trackingNo: no,
    carrierCode: provider?.key ? String(provider.key) : "auto",
    carrierName: provider?.name || "Auto-detected carrier",
    status: st.delivered ? "delivered" : st.out ? "out_for_delivery" : st.info ? "info_received" : "in_transit",
    destination: events.length ? events[events.length - 1].location : "",
    demo: false,
    events
  });
}
__name(track17, "track17");
async function kd100(env, no) {
  const key = env["KUAIDI100_KEY"];
  const customer = env["KUAIDI100_CUSTOMER"];
  if (!key || !customer) return json({ error: "KUAIDI100_KEY not configured", demo: true }, 503);
  const crypto2 = await import("node:crypto");
  const param = JSON.stringify({ com: "auto", num: no, resultv2: "4" });
  const sign = crypto2.createHash("md5").update(param + key + customer).digest("hex").toUpperCase();
  const res = await fetch("https://poll.kuaidi100.com/poll/query.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ customer, sign, param })
  });
  const data = await res.json();
  const events = (data?.data || []).map((e) => ({
    time: e.ftime || e.time || "",
    location: e.areaName || "",
    code: mapKd100(e.status || ""),
    description: e.context || ""
  }));
  return json({
    trackingNo: no,
    carrierCode: data?.com || "auto",
    carrierName: data?.com || "Auto-detected carrier",
    status: data?.state === "3" ? "delivered" : data?.state === "4" ? "exception" : "in_transit",
    destination: events[events.length - 1]?.location || "",
    demo: false,
    events
  });
}
__name(kd100, "kd100");
async function trackingMore(env, no) {
  const key = env["TRACKINGMORE_KEY"];
  if (!key) return json({ error: "TRACKINGMORE_KEY not configured", demo: true }, 503);
  const res = await fetch("https://api.trackingmore.com/v4/trackings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Trackingmore-Api-Key": key },
    body: JSON.stringify({ tracking_number: no })
  });
  const data = await res.json();
  const t = data?.data || {};
  const events = (t?.events || []).map((e) => ({
    time: e.datetime || "",
    location: e.location || "",
    code: mapTM(e.status || ""),
    description: e.description || ""
  }));
  return json({
    trackingNo: no,
    carrierCode: t?.carrier_code || "auto",
    carrierName: t?.carrier_code || "Auto-detected carrier",
    status: t?.status || "in_transit",
    destination: events[events.length - 1]?.location || "",
    demo: false,
    events
  });
}
__name(trackingMore, "trackingMore");
function fmt17Time(t) {
  if (!t) return "";
  const d = new Date(t);
  if (isNaN(d.getTime())) return t.replace("T", " ").slice(0, 16);
  const p = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "p");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
__name(fmt17Time, "fmt17Time");
function map17Event(code) {
  const s = String(code);
  if (/delivered|10/i.test(s)) return "delivered";
  if (/out.?for.?delivery|7/i.test(s)) return "out_for_delivery";
  if (/info.?received|1|pending/i.test(s)) return "info_received";
  if (/customs|清关|11|12/i.test(s)) return "customs";
  if (/exception|exception|13|2/i.test(s)) return "exception";
  if (/picked|揽收/i.test(s)) return "picked_up";
  return "in_transit";
}
__name(map17Event, "map17Event");
function map17Status(code) {
  const s = String(code);
  return {
    delivered: s === "Delivered" || s === "10",
    out: s === "Out for delivery" || s === "7",
    info: s === "InfoReceived" || s === "1" || s === "Pending"
  };
}
__name(map17Status, "map17Status");
function mapKd100(status) {
  if (status === "3") return "delivered";
  if (status === "5") return "out_for_delivery";
  if (status === "1") return "info_received";
  if (status === "11" || status === "12") return "customs";
  if (status === "2" || status === "4" || status === "13") return "exception";
  return "in_transit";
}
__name(mapKd100, "mapKd100");
function mapTM(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return "delivered";
  if (s.includes("out for delivery")) return "out_for_delivery";
  if (s.includes("pending") || s.includes("info received")) return "info_received";
  if (s.includes("customs")) return "customs";
  if (s.includes("exception") || s.includes("failed")) return "exception";
  return "in_transit";
}
__name(mapTM, "mapTM");
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
__name(json, "json");

// ../.wrangler/tmp/pages-oLgBy9/functionsRoutes-0.49649455978585433.mjs
var routes = [
  {
    routePath: "/api/reviews",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/reviews",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/track",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j2 = i + 1;
      while (j2 < str.length) {
        var code = str.charCodeAt(j2);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j2++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j2;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j2 = i + 1;
      if (str[j2] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j2));
      }
      while (j2 < str.length) {
        if (str[j2] === "\\") {
          pattern += str[j2++] + str[j2++];
          continue;
        }
        if (str[j2] === ")") {
          count--;
          if (count === 0) {
            j2++;
            break;
          }
        } else if (str[j2] === "(") {
          count++;
          if (str[j2 + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j2));
          }
        }
        pattern += str[j2++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j2;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
