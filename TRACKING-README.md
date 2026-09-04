# 物流追踪功能接入指南

客户下单后，可在网站 **Track Order（物流追踪）** 区块输入运单号实时查询包裹轨迹。
支持"国内段"（卖家发货到我们长沙仓库：顺丰/中通/圆通/韵达等）与"国际段"
（菜鸟/云途/燕文等从我们仓库发往海外客户）。

## 一、当前状态（演示模式）

- 前端已实现完整的查询 UI：运单号输入 + 承运商下拉 + 状态徽章 + 轨迹时间线。
- 未配置真实 API Key 时自动运行 **Demo 演示数据**（按运单号 hash 生成不同进度），可完整体验。
- Demo 面板会显示提示：接入 API Key 后即可实时追踪。

## 二、选择追踪服务商（三选一）

| 平台 | 支持承运商 | 免费额度 | 费用 | 适配建议 |
|------|-----------|---------|------|---------|
| **17TRACK** | 3487家（含菜鸟/云途/燕文/顺丰/中通/圆通/韵达/USPS/DHL/FedEx/UPS） | 新号一次性送 **200个** 单号 | Basic 1万单 ¥299/年 | ✅ 覆盖最全，跨境首选 |
| **快递100 Kuaidi100** | 1000+国内外快递 | 永久免费档（每日有次数上限） | 有付费档 | 国内+国际都可，永久免费档适合起步 |
| **TrackingMore** | 1000+ 全球承运商 | 免费 500次/月 | 付费档从 $29/月 | 开发文档好，跨境追踪通用 |

> 建议：起步用 **17TRACK**（免费200单足够验证）或 **快递100 免费档**（永久免费）。
> 上线后按实际查询量决定是否升级。

## 三、启用真实追踪（部署到 Cloudflare Pages 后）

### 1. 获取 API Key
- **17TRACK**：https://api.17track.net 注册 → Settings 获取 Access Key
- **快递100**：https://api.kuaidi100.com 注册 → 企业版获取 key + customer
- **TrackingMore**：https://www.trackingmore.com 注册 → API Key

### 2. 配置环境变量
Cloudflare Pages 项目 → Settings → Environment variables 添加：

```
TRACKING_PROVIDER=17track        # 或 kd100 / trackingmore
17TRACK_KEY=你的key              # 选17track时（已在 2026-09-04 实测通过 v2.4）
KUAIDI100_KEY=你的key            # 选kd100时
KUAIDI100_CUSTOMER=你的customer  # 选kd100时
TRACKINGMORE_KEY=你的key         # 选trackingmore时
```

> ✅ **已实测（2026-09-04）**：17TRACK v2.4 register / gettrackinfo 已用真实 Key
> 跑通（register 返回 code:0、运单被 accepted；gettrackinfo 正确返回承运商 China Post
> 与 latest_status）。代理函数 `functions/api/track.ts` 已按 v2.4 真实响应结构校准
> （data.accepted[0].track_info + tracking.providers[].events），部署后即可返回真实轨迹。

### 3. 部署
`functions/api/track.ts` 已随仓库就位，Cloudflare Pages 会自动识别并部署为
`/api/track` 服务。前端 `src/lib/tracking.ts` 会先请求该代理，成功则返回真实轨迹，
失败（未部署/未配Key）自动回退演示数据。

### 4. 安全说明
- API Key **只存在服务端**（Cloudflare 环境变量），浏览器永远拿不到。
- 演示模式下前端直接 `/api/track` 会 404/503 → 前端自动回退 demo，不会报错。

## 四、常见问题
- **查询很慢？** 跨境轨迹首次查询需数秒，17TRACK 可 Webhook 推送实时更新。
- **Webhook 要不要配？** 建议在 17TRACK 后台把 Webhook 指向你的后端，实现"发货后自动推送轨迹到客户邮箱"（进阶）。
- **运单号格式**：菜鸟/云途通常为 LP + 数字，国内顺丰为 12 位数字；输入框支持任意格式。
