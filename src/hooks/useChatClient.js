import { useState } from 'react';
import axios from 'axios';

const MODEL_ROUTER = {
  polish: 'DeepSeek-V3.2',
  search: 'Claude-Haiku-3.5-Search',
  audit: 'Gemini-3-Pro',
  opinion: 'GPT-4o-mini-Search',
  chat: 'Gemini-3-Pro'
};

export function useChatClient() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sideData, setSideData] = useState(null);

  const appendMessage = (message) => setMessages((prev) => [...prev, message]);

  const sendMessage = async ({ content, mode, model: modelOverride, attachments = [] }) => {
    const model = modelOverride || MODEL_ROUTER[mode] || MODEL_ROUTER.chat;
    const userMessage = { role: 'user', content, mode, attachments, timestamp: Date.now() };
    appendMessage(userMessage);

    setLoading(true);
    try {
      const { data } = await axios.post('/api/chat', {
        prompt: content,
        mode,
        model,
        attachments
      });

      if (data?.messages) {
        setMessages((prev) => [...prev, ...data.messages]);
      }

      if (data?.sidePanel) {
        setSideData(data.sidePanel);
      }
    } catch (error) {
      const apiError = error.response?.data?.error || error.message;
      const detail = error.response?.data?.details;
      appendMessage({
        role: 'assistant',
        content: `请求失败：${apiError}${detail ? `（${detail}）` : ''}`,
        error: true,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sideData,
    sendMessage
  };
}
