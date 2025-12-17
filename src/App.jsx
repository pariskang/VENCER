import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Send,
  Paperclip,
  BarChart3,
  FileSearch,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Globe,
  Loader2,
  RefreshCw,
  Command
} from 'lucide-react';
import { useChatClient } from './hooks/useChatClient';

const styles = {
  glass: 'bg-slate-900/80 backdrop-blur-xl border border-slate-700/50',
  primaryGradient:
    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
  textGradient: 'bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white',
  card: 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all duration-300'
};

const MODE_META = {
  polish: { label: '智能润色', description: '调用 DeepSeek-V3.2 对公文进行严谨润色' },
  search: { label: '文献调研', description: 'Claude-Haiku-3.5-Search + WebSearch 进行权威检索' },
  audit: { label: '合规审查', description: 'Gemini-3-Pro 全面推理潜在风险与逻辑漏洞' },
  opinion: { label: '舆情监测', description: 'GPT-4o-mini-Search 实时查询网络热度与趋势' },
  chat: { label: '通用对话', description: 'Gemini-3-Pro 提供综合决策建议' }
};

const DEFAULT_MODEL = 'Gemini-3-Pro';
const MODEL_OPTIONS = [
  'Gemini-3-Pro',
  'GPT-4o-mini-Search',
  'DeepSeek-V3.2',
  'Claude-Haiku-3.5-Search'
];

function App() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const {
    activeMode: mode,
    setActiveMode,
    messages,
    loading,
    sideData,
    sendMessage,
    poeKey,
    setPoeKey,
    downloadConversation
  } = useChatClient();
  const [poeKeyInput, setPoeKeyInput] = useState(poeKey);

  useEffect(() => {
    setPoeKeyInput(poeKey);
  }, [poeKey]);

  const headerStatus = useMemo(() => MODE_META[mode] ?? MODE_META.chat, [mode]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage({ content: input, mode, model: selectedModel, attachments });
    setInput('');
    setAttachments([]);
  };

  const handleFile = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files.map((file) => ({ name: file.name, size: file.size })));
  };

  return (
    <div className="flex h-screen w-full bg-[#0B1120] text-slate-200 font-sans selection:bg-blue-500/30">
      <aside className={`w-20 lg:w-64 flex-shrink-0 flex flex-col justify-between p-4 ${styles.glass} border-r-0`}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="text-white w-5 h-5" />
            </div>
            <span className={`font-bold text-lg tracking-wider hidden lg:block ${styles.textGradient}`}>VENCER</span>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<Sparkles />} label="智能润色" active={mode === 'polish'} onClick={() => setActiveMode('polish')} />
            <NavItem icon={<FileSearch />} label="文献调研" active={mode === 'search'} onClick={() => setActiveMode('search')} />
            <NavItem icon={<ShieldAlert />} label="合规审查" active={mode === 'audit'} onClick={() => setActiveMode('audit')} />
            <NavItem icon={<Globe />} label="舆情监测" active={mode === 'opinion'} onClick={() => setActiveMode('opinion')} />
            <NavItem icon={<Command />} label="通用对话" active={mode === 'chat'} onClick={() => setActiveMode('chat')} />
          </nav>
        </div>

        <div className="hidden lg:block px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">System Status</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400">API Online</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            文以载道，策定未来
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0B1120]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">当前任务模型：</span>
            <div className="relative">
              <select
                className="appearance-none flex items-center gap-2 px-3 py-1.5 pr-6 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors text-xs font-mono text-blue-300 cursor-pointer"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-blue-300" />
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">{headerStatus.description}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="hidden md:flex items-center gap-2">
              <input
                value={poeKeyInput}
                onChange={(e) => setPoeKeyInput(e.target.value)}
                type="password"
                placeholder="输入 Poe API Key"
                className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-[11px] text-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              />
              <button
                onClick={() => setPoeKey(poeKeyInput.trim())}
                className="px-2 py-1 rounded bg-blue-600/70 text-white text-[11px] hover:bg-blue-500 transition-colors"
              >
                保存Key
              </button>
            </div>
            <button
              onClick={() => downloadConversation(mode)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-[11px] hover:border-blue-400"
            >
              导出Markdown
            </button>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/30 text-blue-400 border border-blue-800">SECURE</span>
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Latency 45ms</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
              <WelcomeState onQuickSelect={setActiveMode} />
            ) : (
              messages.map((message, idx) => (
                <MessageBubble key={message.timestamp || idx} message={message} loading={loading} />
              ))
            )}
          </div>

          <SidePanel mode={mode} sideData={sideData} />
        </div>

        <div className="p-6 pt-2">
          <div className={`relative rounded-xl border border-slate-600/50 bg-slate-800/40 backdrop-blur-md shadow-2xl transition-all focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20`}>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <Paperclip size={14} /> 上传公文
                <input type="file" className="hidden" onChange={handleFile} multiple />
              </label>
              <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
              <span className="text-xs text-slate-500">Mode: </span>
              <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">Auto-Reasoning</span>
              {attachments.length > 0 && (
                <span className="text-[10px] text-amber-300">已添加 {attachments.length} 个附件</span>
              )}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在此输入指令，或按 '/' 唤起专业工具链..."
              className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 px-4 py-3 focus:ring-0 resize-none h-28 font-light text-base"
            />

            <div className="absolute bottom-3 right-3 flex items-center gap-3">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-300" />}
              <button
                className={`${styles.primaryGradient} text-white p-2 rounded-lg shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center gap-2 px-4`}
                onClick={handleSend}
              >
                <span className="text-sm font-medium">执行</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">Powered by VENCER • Data Encrypted</p>
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
      active ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    <div className={`${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>{React.cloneElement(icon, { size: 20 })}</div>
    <span className="hidden lg:block text-sm font-medium">{label}</span>
  </button>
);

const MessageBubble = ({ message, loading }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-700/40 border border-blue-500/30 flex items-center justify-center">
          <Bot size={18} className="text-blue-200" />
        </div>
      )}
      <div
        className={`max-w-3xl rounded-2xl px-4 py-3 shadow-lg border ${
          isUser
            ? 'bg-slate-800/80 border-slate-700 text-slate-100'
            : 'bg-slate-900/70 border-slate-700 text-slate-100'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>
        {message.references && (
          <div className="mt-3 space-y-2">
            {message.references.map((ref) => (
              <div key={ref.title} className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-2">
                <div className="font-medium">{ref.title}</div>
                <div className="text-blue-200/80">{ref.url}</div>
              </div>
            ))}
          </div>
        )}
        {loading && !isUser && <div className="text-xs text-slate-500 mt-2">生成中...</div>}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center">
          <Command size={16} className="text-slate-300" />
        </div>
      )}
    </div>
  );
};

const WelcomeState = ({ onQuickSelect }) => (
  <div className="h-full flex flex-col items-center justify-center opacity-90">
    <h1 className="text-3xl font-light mb-8 text-center">
      <span className="block text-slate-500 text-sm mb-2 uppercase tracking-[0.3em]">AI Governance Assistant</span>
      文以载道，策定未来
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
      <QuickAction
        title="政策文件润色"
        desc="上传草稿，优化公文措辞与格式规范"
        icon={<Sparkles className="w-4 h-4 text-amber-400" />}
        onClick={() => onQuickSelect('polish')}
      />
      <QuickAction
        title="相关法规检索"
        desc="基于语义库深度检索历史关联政策"
        icon={<FileSearch className="w-4 h-4 text-blue-400" />}
        onClick={() => onQuickSelect('search')}
      />
      <QuickAction
        title="漏洞风险排查"
        desc="逻辑自洽性检查与法律冲突预警"
        icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
        onClick={() => onQuickSelect('audit')}
      />
      <QuickAction
        title="实时舆情快报"
        desc="全网关键词热度趋势与情感分析"
        icon={<BarChart3 className="w-4 h-4 text-emerald-400" />}
        onClick={() => onQuickSelect('opinion')}
      />
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick }) => (
  <button
    className="flex flex-col items-start p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30 transition-all text-left group"
    onClick={onClick}
  >
    <div className="mb-3 p-2 rounded-lg bg-slate-900 border border-slate-700 group-hover:border-blue-500/30 shadow-sm">{icon}</div>
    <h3 className="text-slate-200 font-medium mb-1">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </button>
);

const SidePanel = ({ mode, sideData }) => {
  if (!sideData) {
    return (
      <div className="hidden xl:block w-80 border-l border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <PanelHeader mode={mode} />
        <Placeholder mode={mode} />
      </div>
    );
  }

  return (
    <div className="hidden xl:block w-80 border-l border-slate-800 bg-slate-900/40 p-6 space-y-6">
      <PanelHeader mode={mode} />
      {sideData.type === 'trend' && <TrendList trend={sideData.data} />}
      {sideData.type === 'diff' && <DiffPreview diff={sideData.data} />}
      {sideData.type === 'references' && <ReferenceList references={sideData.data} />}
    </div>
  );
};

const PanelHeader = ({ mode }) => (
  <div>
    <div className="text-xs uppercase text-slate-500 tracking-[0.25em] mb-2">COPILOT</div>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-slate-100">{MODE_META[mode]?.label || '智能助手'}</div>
        <div className="text-xs text-slate-500">实时辅助面板</div>
      </div>
      <RefreshCw size={16} className="text-slate-500" />
    </div>
  </div>
);

const Placeholder = ({ mode }) => (
  <div className="rounded-xl border border-dashed border-slate-700/80 p-4 text-sm text-slate-500">
    {mode === 'opinion' && '舆情监测时将展示实时热度折线与情感倾向。'}
    {mode === 'polish' && '润色完成后会在此呈现原文/新文对比。'}
    {mode === 'search' && '调研完成后会展示权威来源列表。'}
    {mode === 'audit' && '合规审查会生成风险摘要与建议。'}
    {mode === 'chat' && '选择任意模式或直接输入指令开始对话。'}
  </div>
);

const TrendList = ({ trend }) => (
  <div className="space-y-3">
    <div className="text-xs text-slate-400">实时热度</div>
    {trend.map((point) => (
      <div key={point.time} className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{point.time}</span>
        <span className="text-emerald-300 font-mono">{Math.round(point.sentiment * 100) / 100}</span>
      </div>
    ))}
  </div>
);

const DiffPreview = ({ diff }) => (
  <div className="space-y-3 text-sm">
    <div className="text-xs text-slate-400">润色前后比对</div>
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <div className="text-emerald-300 font-semibold mb-2">新增</div>
      <p className="text-slate-200 whitespace-pre-line">{diff.added}</p>
    </div>
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
      <div className="text-rose-300 font-semibold mb-2">删除</div>
      <p className="text-slate-400 whitespace-pre-line">{diff.removed}</p>
    </div>
  </div>
);

const ReferenceList = ({ references }) => (
  <div className="space-y-3 text-sm">
    <div className="text-xs text-slate-400">权威来源</div>
    {references.map((ref) => (
      <a
        key={ref.url}
        href={ref.url}
        className="block rounded-lg border border-slate-700 hover:border-blue-500/50 bg-slate-800/40 p-3 transition-colors"
        target="_blank"
        rel="noreferrer"
      >
        <div className="text-slate-100 font-medium">{ref.title}</div>
        <div className="text-xs text-blue-300">{ref.source}</div>
      </a>
    ))}
  </div>
);

export default App;
