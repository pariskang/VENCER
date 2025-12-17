# VENCER

文以载道，策定未来 (Scripting the Logic of Governance)

VENCER 是一个面向政务场景的对话交互应用，集成了舆情查询、文档润色、政策文献调研等多模态能力，并可通过统一的 Poe API 路由到 GPT-4o-mini-Search、DeepSeek-V3.2 与 Claude-Haiku-3.5-Search 等模型。

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置密钥（两种方式，二选一）

```bash
cp .env.example .env
# 方式A：在 .env 中设置 POE_API_KEY
# 方式B：跳过此步，启动后在前端右上角输入 Poe API Key（仅保存在浏览器）
```

3. 启动后端接口 (Express + Poe API 代理)

```bash
npm run start:server
```

4. 启动前端 (Vite + React + Tailwind)

```bash
npm run dev
```

默认开发端口：前端 5173，后端 4000（Vite 已配置 API 代理）。

## 交互模式与模型映射

| 模式 | 描述 | 默认模型 |
| --- | --- | --- |
| 舆情监测 | 实时查询网络热度趋势 | GPT-4o-mini-Search（启用 web_search） |
| 文档润色 | 公文措辞与结构优化 | DeepSeek-V3.2 |
| 文献调研 | 政策法规检索并返回来源卡片 | Claude-Haiku-3.5-Search（启用 web_search） |
| 合规审查 | 风险点审查与逻辑核查 | Gemini-3-Pro |
| 通用对话 | 综合智能问答 | Gemini-3-Pro |

## 多轮对话与会话留存

- 前端为每个功能模式维护独立对话线程，切换页面不会丢失历史记录。
- 发送消息时会将该模式的过往对话作为 `history` 一并提交给后端，实现真正的多轮上下文。
- 手动输入的 Poe API Key 以及各模式对话都会保存在浏览器 localStorage（仅本地），方便刷新或二次打开继续使用。
- 点击头部的 “导出Markdown” 按钮，可将当前模式的对话记录下载为 `.md` 文件留档。

## 文件结构

- `src/App.jsx`：核心布局（功能导航、对话流、侧边 Copilot 面板）及 UI 交互逻辑。
- `src/hooks/useChatClient.js`：统一消息发送与侧边面板数据管理，自动根据模式路由模型。
- `server/index.js`：Express 服务封装 Poe API 调用示例，并为不同模式返回示例侧栏数据。
- `tailwind.config.js` / `postcss.config.js` / `src/index.css`：样式系统。

## Poe API 使用说明

服务端通过 `openai` SDK 以 `baseURL=https://api.poe.com/v1` 调用（可通过环境变量覆盖和配置代理）：

- `POE_API_KEY`：Poe API Key，必填，否则接口直接返回错误提示。
- `POE_BASE_URL`：可选，默认 `https://api.poe.com/v1`。
- `POE_PROXY` / `HTTPS_PROXY`：可选，若内网需代理访问 Poe，请设置代理地址（如 `http://127.0.0.1:7890`），服务器会自动创建代理 Agent。
- `POE_TIMEOUT_MS`：可选，请求超时时间，默认 30000ms。

```js
const response = await client.chat.completions.create({
  model: 'Claude-Haiku-3.5-Search',
  messages: [
    { role: 'system', content: 'VENCER 对话助手' },
    { role: 'user', content: '请检索数字经济相关政策' }
  ],
  extra_body: { web_search: true }
});
```

前端的多模型选择与模式切换均与此路由保持一致，确保 UI “执行”按钮可直接联通后端接口完成真实调研、润色或舆情查询。

- `/api/chat` 请求体默认包含 `poeKey`（手动输入的密钥）与 `history`（当前模式历史消息），后端会优先使用手动密钥，否则退回到环境变量 `POE_API_KEY`。

### 常见连通性排查

1. 确认已在前端输入 Poe API Key 或设置 `POE_API_KEY`；缺少密钥会直接返回 400。
2. 若出现 `ETIMEDOUT` 或无法连接，尝试：
   - 设置 `POE_PROXY`/`HTTPS_PROXY` 走可用代理；
   - 若目标网关需自定义，调整 `POE_BASE_URL`；
   - 增大 `POE_TIMEOUT_MS` 以适配慢网络。
3. 服务器已在错误响应中回传 `error`、`details` 与 `requestId`，可以在前端提示中看到具体原因，便于排查。
