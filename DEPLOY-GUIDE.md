# BuyTCN 独立站 — 部署上线指南

> 目标托管：**Cloudflare Pages**（免费 · 无限带宽 · 全球 330+ 节点）
> 目标市场：美国 / 英国 / 欧洲 / 中东高收入地区

---

## 一、本地开发

```bash
cd chinashop
npm install --registry=https://registry.npmmirror.com   # 国内网络用镜像
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 产物输出到 dist/
```

## 二、上传到 GitHub（推荐，自动部署）

1. 新建 GitHub 仓库（Public/Private 均可）
2. 推送源码（**排除 node_modules、dist**）：

```bash
git init
git add .
git commit -m "BuyTCN v1.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/chinasavings.git
git push -u origin main
```

## 三、接入 Cloudflare Pages（自动构建）

1. 登录 https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权并选中 `chinasavings` 仓库
3. 构建设置：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**:（仓库根即可）
4. 点击 **Save and Deploy**，约 1 分钟后获得 `https://<项目名>.pages.dev` 线上地址

## 四、配置环境变量（二选一按需）

部署后在 Pages → Settings → **Environment variables** 添加：

| 变量 | 值 | 用途 |
|------|-----|------|
| `TRACKING_PROVIDER` | `17track` 或 `kd100` | 物流实时追踪（可后配） |
| `17TRACK_KEY` | 你的 17TRACK API Key | 见 TRACKING-README.md |
| `KUAIDI100_KEY` / `KUAIDI100_CUSTOMER` | 快递100 Key | 备选 |

> 未配置时，前端自动运行演示追踪数据，网站不会报错。

## 五、绑定自定义域名（建议）

1. 购买域名（Namecheap/Cloudflare Registrar 等）
2. Cloudflare Pages → Custom domains → **Set up a custom domain**
3. DNS 自动托管后，`https://www.你的域名.com` 即可访问（自带免费 SSL）

## 六、上线前 Checklist（务必核对）

### 内容
- [ ] 中美价格对比数据已用真实报价校准（当前为示例值，见 src/sections/PriceComparison.tsx 中 us/cn 金额）
- [ ] 客户评价已替换为真实客户案例（当前为演示文案，src/i18n/locales/en.ts → reviews.items）
- [ ] 物流 Demo 已接真实 API（否则客户查询显示的是模拟轨迹）

### 联系与收款（已配置 ✓）
- [x] 电话 15387592595 / WhatsApp wa.me/8615387592595
- [x] 邮箱 yangmin7823@gmail.com
- [x] 微信 bshine01
- [ ] PayPal $1 支付链接：在收款时把 PayPal.Me 链接发给客户，或在 Contact 区补充"Pay $1 Now"按钮（需要你的 PayPal.Me 地址）

### SEO
- [ ] 提交 Sitemap：Google Search Console 收录 `https://你的域名/sitemap.xml`
- [ ] Bing Webmaster 同步收录
- [ ] 各语言落地页关键词检查（en 已做 OG/结构化数据）

## 七、维护与迭代

| 操作 | 方法 |
|------|------|
| 改文案 | 编辑 `src/i18n/locales/en.ts`（其余语言同步翻译） |
| 改价格 | `src/sections/Pricing.tsx`（阶梯已硬编码在词典 tiers，改词典即可） |
| 加商品/服务 | `src/sections/Services.tsx` |
| 更新 | `git push` → Cloudflare 自动重新构建部署 |
