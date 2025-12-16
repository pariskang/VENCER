import express from 'express';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

const app = express();
const port = process.env.PORT || 4000;
const baseURL = process.env.POE_BASE_URL || 'https://api.poe.com/v1';
const proxyUrl = process.env.POE_PROXY || process.env.HTTPS_PROXY;
const timeoutMs = Number(process.env.POE_TIMEOUT_MS || 30000);

app.use(express.json({ limit: '2mb' }));

const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const client = new OpenAI({
  apiKey: process.env.POE_API_KEY,
  baseURL,
  httpAgent: agent,
  httpsAgent: agent,
  timeout: timeoutMs
});

const SIDE_PANEL_TEMPLATE = {
  opinion: (data) => ({ type: 'trend', data }),
  polish: (data) => ({ type: 'diff', data }),
  search: (data) => ({ type: 'references', data })
};

app.post('/api/chat', async (req, res) => {
  const { prompt, mode = 'chat', model = 'Gemini-3-Pro', attachments = [] } = req.body;

  if (!process.env.POE_API_KEY) {
    return res.status(400).json({ error: 'POE_API_KEY 未设置，请在环境变量或 .env 文件中配置。' });
  }

  if (!prompt) {
    return res.status(400).json({ error: '缺少 prompt 参数' });
  }

  try {
    const messages = [
      { role: 'system', content: 'VENCER - 文以载道，策定未来 (Scripting the Logic of Governance).' },
      { role: 'user', content: prompt }
    ];

    const extraBody = {};
    if (mode === 'opinion' || mode === 'search') {
      extraBody.web_search = true;
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      extra_body: extraBody
    });

    const aiMessage = response.choices?.[0]?.message?.content || '未获取到回复，请重试。';

    const payload = {
      messages: [
        {
          role: 'assistant',
          content: aiMessage,
          timestamp: Date.now(),
          attachments
        }
      ]
    };

    // Build side panel data samples
    if (SIDE_PANEL_TEMPLATE[mode]) {
      payload.sidePanel = SIDE_PANEL_TEMPLATE[mode](mockSideData(mode));
    }

    res.json(payload);
  } catch (error) {
    console.error('chat error', error);
    res.status(500).json({
      error: error.message,
      details: error?.cause?.message || error?.code,
      requestId: error?.request_id
    });
  }
});

app.get('/api/opinion/trend', async (req, res) => {
  const { keyword = '政务' } = req.query;
  const data = mockSideData('opinion').map((point) => ({ ...point, keyword }));
  res.json({ keyword, data });
});

app.post('/api/research', async (req, res) => {
  const { query } = req.body;
  const data = mockSideData('search');
  res.json({ query, references: data });
});

app.listen(port, () => {
  console.log(`VENCER server running on http://localhost:${port}`);
});

function mockSideData(mode) {
  switch (mode) {
    case 'opinion':
      return [
        { time: '10:00', sentiment: 0.76 },
        { time: '11:00', sentiment: 0.82 },
        { time: '12:00', sentiment: 0.67 },
        { time: '13:00', sentiment: 0.9 }
      ];
    case 'polish':
      return {
        added: '新增：强化“数据安全责任制”表述，并补充跨境传输备案路径。',
        removed: '删除：模糊的“及时处理”措辞，改为“48小时内完成整改反馈”。'
      };
    case 'search':
      return [
        {
          title: '国务院关于加强数字政府建设的指导意见',
          url: 'https://www.gov.cn/policies/2024-digital-government',
          source: '国务院办公厅'
        },
        {
          title: '数据安全法实施条例（征求意见稿）',
          url: 'https://www.moj.gov.cn/data-security-draft',
          source: '司法部'
        }
      ];
    default:
      return [];
  }
}

export default app;
