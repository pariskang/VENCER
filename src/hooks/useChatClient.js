import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const MODEL_ROUTER = {
  polish: 'DeepSeek-V3.2',
  search: 'Claude-Haiku-3.5-Search',
  audit: 'Gemini-3-Pro',
  opinion: 'GPT-4o-mini-Search',
  chat: 'Gemini-3-Pro'
};

const STORAGE_KEY_THREADS = 'vencer_threads';
const STORAGE_KEY_KEY = 'vencer_poe_key';
const BUNDLED_KEY = import.meta.env?.VITE_POE_API_KEY || '';

const createThread = (mode) => ({
  id: `${mode}-${Date.now()}`,
  mode,
  messages: [],
  sideData: null
});

export function useChatClient(defaultMode = 'chat') {
  const [threads, setThreads] = useState(() => {
    if (typeof window === 'undefined') return { [defaultMode]: createThread(defaultMode) };
    try {
      const cached = localStorage.getItem(STORAGE_KEY_THREADS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('failed to parse cached threads', err);
    }
    return { [defaultMode]: createThread(defaultMode) };
  });

  const [activeMode, setActiveMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [poeKey, setPoeKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_KEY) || '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (poeKey) {
      localStorage.setItem(STORAGE_KEY_KEY, poeKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
  }, [poeKey]);

  const messages = useMemo(() => threads[activeMode]?.messages || [], [threads, activeMode]);
  const sideData = useMemo(() => threads[activeMode]?.sideData || null, [threads, activeMode]);

  const ensureThread = (mode) => {
    setThreads((prev) => {
      if (prev[mode]) return prev;
      return { ...prev, [mode]: createThread(mode) };
    });
  };

  const appendMessage = (mode, message) => {
    setThreads((prev) => {
      const thread = prev[mode] ?? createThread(mode);
      return {
        ...prev,
        [mode]: {
          ...thread,
          messages: [...thread.messages, message]
        }
      };
    });
  };

  const sendMessage = async ({ content, mode = activeMode, model: modelOverride, attachments = [] }) => {
    const selectedMode = mode || activeMode;
    ensureThread(selectedMode);

    if (!content?.trim()) return;

    const effectiveKey = poeKey || BUNDLED_KEY;

    if (!effectiveKey) {
      appendMessage(selectedMode, {
        role: 'assistant',
        content: '请先在右上角输入 Poe API Key 后再尝试提问。',
        timestamp: Date.now(),
        error: true
      });
      return;
    }

    const model = modelOverride || MODEL_ROUTER[selectedMode] || MODEL_ROUTER.chat;

    const history = (threads[selectedMode]?.messages || []).map((item) => ({
      role: item.role,
      content: item.content
    }));

    const userMessage = { role: 'user', content, mode: selectedMode, attachments, timestamp: Date.now() };
    appendMessage(selectedMode, userMessage);

    setLoading(true);
    try {
      const { data } = await axios.post('/api/chat', {
        prompt: content,
        mode: selectedMode,
        model,
        attachments,
        poeKey: effectiveKey,
        history
      });

      if (data?.messages) {
        setThreads((prev) => {
          const thread = prev[selectedMode] ?? createThread(selectedMode);
          return {
            ...prev,
            [selectedMode]: {
              ...thread,
              messages: [...thread.messages, ...data.messages],
              sideData: data.sidePanel ?? thread.sideData
            }
          };
        });
      }
    } catch (error) {
      const apiError = error.response?.data?.error || error.message;
      const detail = error.response?.data?.details;
      appendMessage(selectedMode, {
        role: 'assistant',
        content: `请求失败：${apiError}${detail ? `（${detail}）` : ''}`,
        error: true,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadConversation = (mode = activeMode) => {
    const thread = threads[mode];
    if (!thread || thread.messages.length === 0) return;

    const lines = [
      '# VENCER 对话记录',
      `- 模式：${mode}`,
      `- 线程：${thread.id}`,
      `- 导出时间：${new Date().toLocaleString()}`,
      ''
    ];

    thread.messages.forEach((msg, idx) => {
      const title = msg.role === 'user' ? '用户' : '助手';
      lines.push(`## ${title} #${idx + 1}`);
      lines.push('');
      lines.push(msg.content || '');
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vencer-${mode}-${thread.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const switchMode = (mode) => {
    setActiveMode(mode);
    ensureThread(mode);
  };

  return {
    activeMode,
    setActiveMode: switchMode,
    messages,
    loading,
    sideData,
    sendMessage,
    poeKey,
    setPoeKey,
    downloadConversation
  };
}
