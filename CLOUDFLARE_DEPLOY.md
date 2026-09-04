# Cloudflare Pages 部署指南

## 一、项目结构

```
chinashop/
├── src/
│   ├── sections/      # 页面区块组件
│   ├── App.tsx        # 主组件
│   └── main.tsx       # 入口
├── public/
│   ├── _headers      # 安全响应头
│   └── _redirects    # SPA路由回退
├── package.json
└── vite.config.ts
```

## 二、部署到 Cloudflare Pages

### 方式1：通过 Git 连接（推荐，自动部署）

1. 创建 GitHub 仓库并推送代码：
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/你的用户名/chinasavings.git
git push -u origin main
```

2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git

3. 选择仓库，配置构建设置：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

4. 点击 Save and Deploy，等待首次构建完成

### 方式2：直接上传（无 Git）
Cloudflare Dashboard → Pages → Create → Direct Upload → 上传 `dist/` 目录

### 方式3：Wrangler CLI
```bash
npm install -g wrangler
npx wrangler pages deploy dist --project-name chinasavings
```

## 三、绑定自定义域名

1. 在 Pages 项目 → Custom domains → Add custom domain
2. 输入你的域名（如 chinasavings.com）
3. 按提示在域名注册商处添加 CNAME 记录
4. Cloudflare 自动签发 SSL 证书

## 四、本地开发预览

```bash
npm install
npm run dev     # 开发服务器 http://localhost:5173
npm run build   # 生产构建输出到 dist/
npm run preview # 预览生产构建
```

## 五、自定义域名指向的 DNS 配置

| 类型 | 名称 | 内容 | 说明 |
|------|------|------|------|
| CNAME | @ | chinasavings.pages.dev | 主域名 |
| CNAME | www | chinasavings.pages.dev | www子域名 |

## 六、后续接入计划

- [ ] PayPal Smart Buttons（$1会员费 + 全款）
- [ ] Supabase 数据库（客户/订单/询价表）
- [ ] Cloudflare Workers（PayPal Webhook 接收）
- [ ] WhatsApp 一键跳转（wa.me 链接替换占位符）
- [ ] Google Analytics 统计
