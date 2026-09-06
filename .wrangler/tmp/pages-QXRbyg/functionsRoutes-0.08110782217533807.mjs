import { onRequestGet as __api_reviews_js_onRequestGet } from "C:\\Users\\Administrator\\WorkBuddy\\2026-09-04-14-49-35\\chinashop\\functions\\api\\reviews.js"
import { onRequestPost as __api_reviews_js_onRequestPost } from "C:\\Users\\Administrator\\WorkBuddy\\2026-09-04-14-49-35\\chinashop\\functions\\api\\reviews.js"
import { onRequest as __api_track_ts_onRequest } from "C:\\Users\\Administrator\\WorkBuddy\\2026-09-04-14-49-35\\chinashop\\functions\\api\\track.ts"

export const routes = [
    {
      routePath: "/api/reviews",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_reviews_js_onRequestGet],
    },
  {
      routePath: "/api/reviews",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reviews_js_onRequestPost],
    },
  {
      routePath: "/api/track",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_track_ts_onRequest],
    },
  ]