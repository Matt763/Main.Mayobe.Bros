import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ITANGO_AUTH_KEY = 'itango-session-v1';

// Helper: fetch with the iTango Bearer token automatically attached
function itangoFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = '';
  try {
    const raw = sessionStorage.getItem(ITANGO_AUTH_KEY);
    if (raw) token = JSON.parse(raw).token || '';
  } catch {}
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}
import {
  Bot, Send, FileText, Folder, FolderOpen, ChevronRight, ChevronDown,
  Play, Eye, GitCommit, Settings, RefreshCw, AlertTriangle, CheckCircle2,
  Shield, Activity, Zap, X, Loader2, Terminal, Globe, Lock,
  Cpu, Code2, BarChart3, Search, RotateCcw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Provider = 'claude' | 'openai' | 'gemini';
type Model = {
  id: string;
  label: string;
  provider: Provider;
  description: string;
};
type Message = { role: 'user' | 'assistant'; content: string; ts: number };
type FileNode = { name: string; path: string; type: 'file' | 'dir'; size?: number; sha?: string };
type AnalysisType = 'general' | 'seo' | 'security' | 'performance';

const MODELS: Model[] = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'claude', description: 'Balanced & fast' },
  { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6',   provider: 'claude', description: 'Most powerful' },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  provider: 'claude', description: 'Ultra fast' },
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'openai', description: 'OpenAI flagship' },
  { id: 'gemini-pro',        label: 'Gemini Pro',        provider: 'gemini', description: 'Google AI' },
];

const PROVIDER_COLORS: Record<Provider, string> = {
  claude: '#d97706',
  openai: '#10b981',
  gemini: '#3b82f6',
};

// ─── File tree node ───────────────────────────────────────────────────────────
function FileTreeNode({
  node, depth, onSelect, selected, onExpand, expanded, loading,
}: {
  node: FileNode; depth: number; selected?: string; onSelect: (n: FileNode) => void;
  onExpand: (path: string) => void; expanded: Set<string>; loading: Set<string>;
}) {
  const isDir = node.type === 'dir';
  const isOpen = expanded.has(node.path);
  const isLoading = loading.has(node.path);
  const isSelected = selected === node.path;

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return '🔷';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.md')) return '📝';
    if (name.endsWith('.js')) return '🟡';
    if (name.endsWith('.html')) return '🌐';
    return '📄';
  };

  return (
    <div>
      <button
        onClick={() => { isDir ? onExpand(node.path) : onSelect(node); }}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-left text-xs rounded transition-colors"
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          background: isSelected ? 'rgba(52,124,37,0.18)' : 'transparent',
          color: isSelected ? '#4ade80' : '#94a3b8',
        }}
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {isDir ? (
          isLoading ? <Loader2 size={12} className="animate-spin flex-shrink-0" /> :
          isOpen ? <ChevronDown size={12} className="flex-shrink-0" /> :
          <ChevronRight size={12} className="flex-shrink-0" />
        ) : <span className="text-[10px] flex-shrink-0">{getFileIcon(node.name)}</span>}
        <span className="truncate">{node.name}</span>
      </button>
    </div>
  );
}

// ─── Markdown-ish message renderer ───────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return (
            <pre
              key={i}
              className="rounded-lg p-3 text-xs overflow-x-auto"
              style={{ background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace' }}
            >
              {lang && <div className="text-[10px] text-gray-500 mb-2">{lang}</div>}
              <code>{code}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#e2e8f0' }}>
            {part}
          </p>
        );
      })}
    </div>
  );
}

// ─── Commit confirmation modal ────────────────────────────────────────────────
function CommitModal({
  filePath, onConfirm, onCancel, loading,
}: {
  filePath: string; onConfirm: (msg: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [msg, setMsg] = useState('iTango AI: update file');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 max-w-md w-full mx-4 space-y-4" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.15)' }}>
            <AlertTriangle size={20} style={{ color: '#fb923c' }} />
          </div>
          <div>
            <h3 className="font-bold text-white">Deploy to Live Website?</h3>
            <p className="text-xs text-slate-400">This will push changes to production</p>
          </div>
        </div>
        <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fdba74' }}>
          ⚠️ These changes will affect <strong>mayobebros.com</strong> once deployed. Review carefully before proceeding.
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">File: <span className="text-green-400">{filePath}</span></p>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
            placeholder="Commit message..."
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: '#1e293b', color: '#94a3b8' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(msg)}
            disabled={loading || !msg.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: loading ? '#166534' : '#16a34a', color: 'white' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCommit size={14} />}
            {loading ? 'Committing…' : 'Commit & Push'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [keys, setKeys] = useState<Record<string, string>>({ claude: '', openai: '', gemini: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    itangoFetch('/api/itango/settings', { credentials: 'include' })
      .then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const saveKey = async (provider: string) => {
    setSaving(true);
    await itangoFetch('/api/itango/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey: keys[provider] }),
    });
    setSaving(false); setSaved(provider);
    setTimeout(() => setSaved(''), 2000);
  };

  const setActive = async (provider: string) => {
    await itangoFetch('/api/itango/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setActive: provider }),
    });
    setSettings((s: any) => s ? { ...s, activeProvider: provider } : s);
  };

  const providers = [
    { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-api03-...', color: '#d97706' },
    { id: 'openai', label: 'OpenAI GPT', placeholder: 'sk-proj-...', color: '#10b981' },
    { id: 'gemini', label: 'Google Gemini', placeholder: 'AIzaSy...', color: '#3b82f6' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 max-w-lg w-full mx-4 space-y-5" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-green-400" />
            <h3 className="font-bold text-white">AI Engine Settings</h3>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <p className="text-xs text-slate-400">API keys are stored in server memory and .env file. They are never exposed to the browser.</p>

        <div className="space-y-4">
          {providers.map(p => (
            <div key={p.id} className="rounded-xl p-4 space-y-3" style={{ background: '#1e293b', border: `1px solid ${settings?.activeProvider === p.id ? p.color + '44' : '#334155'}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm font-semibold text-white">{p.label}</span>
                  {settings?.providers?.[p.id]?.configured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                      CONFIGURED
                    </span>
                  )}
                </div>
                {settings?.activeProvider !== p.id ? (
                  <button
                    onClick={() => setActive(p.id)}
                    className="text-xs px-3 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                  >
                    Set Active
                  </button>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: p.color + '22', color: p.color }}>
                    ACTIVE
                  </span>
                )}
              </div>
              {settings?.providers?.[p.id]?.keyHint && (
                <p className="text-xs text-slate-500">Current: <span className="font-mono">{settings.providers[p.id].keyHint}</span></p>
              )}
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={p.placeholder}
                  value={keys[p.id]}
                  onChange={e => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                />
                <button
                  onClick={() => saveKey(p.id)}
                  disabled={saving || !keys[p.id]}
                  className="px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: saved === p.id ? '#166534' : p.color + '22', color: saved === p.id ? '#4ade80' : p.color }}
                >
                  {saved === p.id ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 space-y-2" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Globe size={12} /> Integrations
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: settings?.github?.configured ? '#4ade80' : '#ef4444' }} />
              <span className="text-slate-400">GitHub: {settings?.github?.repo || 'not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: settings?.vercel?.configured ? '#4ade80' : '#ef4444' }} />
              <span className="text-slate-400">Vercel: {settings?.vercel?.configured ? 'connected' : 'not set'}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            Add GITHUB_TOKEN, VERCEL_TOKEN, VERCEL_PROJECT_ID to your .env file
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ITangoEditorPage() {
  const navigate = useNavigate();

  // ── iTango session guard ──────────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(ITANGO_AUTH_KEY);
    if (!raw) { navigate('/itango-login', { replace: true }); return; }
    try {
      const { exp, token } = JSON.parse(raw);
      if (Date.now() >= exp || !token) {
        sessionStorage.removeItem(ITANGO_AUTH_KEY);
        navigate('/itango-login', { replace: true });
      }
    } catch {
      sessionStorage.removeItem(ITANGO_AUTH_KEY);
      navigate('/itango-login', { replace: true });
    }
  }, [navigate]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `👋 **iTango AI Website Editor** is online.\n\nI have full access to your Mayobe Bros codebase. I can:\n• Read and analyze any file\n• Suggest and write code improvements\n• Fix bugs and optimize performance\n• Improve SEO and content structure\n\nSelect a file from the tree, or ask me anything about your website.`,
    ts: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  // File tree state
  const [treeRoot, setTreeRoot] = useState<FileNode[]>([]);
  const [treeChildren, setTreeChildren] = useState<Record<string, FileNode[]>>({});
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']));
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSha, setFileSha] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'chat' | 'tree'>('chat');
  const [rightTab, setRightTab] = useState<'editor' | 'preview' | 'activity'>('editor');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load root file tree
  useEffect(() => {
    itangoFetch('/api/itango/files', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTreeRoot(d.items || []))
      .catch(() => {});
  }, []);

  // Load activity log
  useEffect(() => {
    if (rightTab === 'activity') {
      itangoFetch('/api/itango/activity', { credentials: 'include' })
        .then(r => r.json()).then(d => setActivityLog(d.log || [])).catch(() => {});
    }
  }, [rightTab]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDir = async (path: string) => {
    if (treeChildren[path]) {
      setExpandedDirs(prev => {
        const next = new Set(prev);
        next.has(path) ? next.delete(path) : next.add(path);
        return next;
      });
      return;
    }
    setLoadingDirs(prev => new Set(prev).add(path));
    try {
      const res = await itangoFetch(`/api/itango/files?path=${encodeURIComponent(path)}`, { credentials: 'include' });
      const d = await res.json();
      setTreeChildren(prev => ({ ...prev, [path]: d.items || [] }));
      setExpandedDirs(prev => new Set(prev).add(path));
    } finally {
      setLoadingDirs(prev => { const n = new Set(prev); n.delete(path); return n; });
    }
  };

  const loadFile = async (node: FileNode) => {
    setSelectedFile(node);
    setFileLoading(true);
    try {
      const res = await itangoFetch(`/api/itango/file?path=${encodeURIComponent(node.path)}`, { credentials: 'include' });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      setFileContent(d.content);
      setEditedContent(d.content);
      setFileSha(d.sha);
      setIsDirty(false);
      setRightTab('editor');
    } finally {
      setFileLoading(false);
    }
  };

  const handleAnalyze = async (type: AnalysisType) => {
    if (!selectedFile || !fileContent) return;
    setAnalysisLoading(true);
    const prompt = `Analyze ${selectedFile.path} (${type} review):\n\n\`\`\`\n${fileContent.slice(0, 6000)}\n\`\`\``;
    await sendMessage(prompt, true);
    setAnalysisLoading(false);
  };

  const sendMessage = useCallback(async (overrideInput?: string, skipAppend?: boolean) => {
    const text = (overrideInput ?? input).trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    if (!skipAppend) setMessages(newMessages);
    else setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    // Show typing placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', ts: Date.now() }]);

    try {
      const context = selectedFile
        ? `File: ${selectedFile.path}\nContent (first 3000 chars):\n${fileContent.slice(0, 3000)}`
        : '';

      const res = await itangoFetch('/api/itango/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel.id,
          systemContext: context,
        }),
      });

      // Server returns plain JSON: { reply: "..." } or { error: "..." }
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status} — non-JSON response` }));

      if (!res.ok || data.error) {
        // 401/403 = stale token, redirect to login
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem(ITANGO_AUTH_KEY);
          setMessages(prev => prev.slice(0, -1).concat({
            role: 'assistant',
            content: '🔒 Session expired. Redirecting to login…',
            ts: Date.now(),
          }));
          setTimeout(() => { window.location.href = '/itango-login'; }, 1800);
          return;
        }
        setMessages(prev => prev.slice(0, -1).concat({
          role: 'assistant',
          content: `❌ ${data.error || `Server error (${res.status})`}`,
          ts: Date.now(),
        }));
        return;
      }

      const reply: string = data.reply || '(empty response)';
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: reply };
        return copy;
      });
    } catch (err: any) {
      setMessages(prev => prev.slice(0, -1).concat({
        role: 'assistant',
        content: `❌ Network error: ${err.message}`,
        ts: Date.now(),
      }));
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, selectedModel, selectedFile, fileContent]);

  const handleCommit = async (commitMessage: string) => {
    if (!selectedFile) return;
    setCommitLoading(true);
    try {
      const res = await itangoFetch('/api/itango/commit', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile.path,
          content: editedContent,
          message: commitMessage,
          sha: fileSha,
        }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      setFileContent(editedContent);
      setIsDirty(false);
      setShowCommitModal(false);
      showToast('✓ Changes committed to GitHub');
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDeploy = async (target: 'preview' | 'production') => {
    setDeployLoading(true);
    try {
      const res = await itangoFetch('/api/itango/deploy', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      showToast(`✓ Deployment triggered${d.url ? ` → ${d.url}` : ''}`);
    } finally {
      setDeployLoading(false);
    }
  };

  // Render file tree recursively
  const renderTree = (nodes: FileNode[], depth = 0): JSX.Element[] =>
    nodes.flatMap(node => [
      <FileTreeNode
        key={node.path}
        node={node}
        depth={depth}
        selected={selectedFile?.path}
        onSelect={loadFile}
        onExpand={loadDir}
        expanded={expandedDirs}
        loading={loadingDirs}
      />,
      ...(node.type === 'dir' && expandedDirs.has(node.path) && treeChildren[node.path]
        ? renderTree(treeChildren[node.path], depth + 1)
        : []),
    ]);

  const quickPrompts = [
    'What files handle authentication?',
    'Suggest SEO improvements for the homepage',
    'Find performance bottlenecks in the codebase',
    'How can I improve the mobile experience?',
    'Show me how routing works in this project',
  ];

  return (
    <div style={{ background: '#000000', minHeight: '100vh' }}>
      <div className="flex flex-col" style={{ height: '100vh' }}>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-t-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d1b0f 0%, #0a1628 100%)', border: '1px solid rgba(52,124,37,0.3)', borderBottom: '1px solid rgba(52,124,37,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,124,37,0.2)', border: '1px solid rgba(52,124,37,0.4)' }}>
              <Cpu size={16} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">iTango AI Website Editor</h1>
              <p className="text-[10px]" style={{ color: '#4ade80' }}>Full access to mayobebros.com codebase</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
              <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <select
              value={selectedModel.id}
              onChange={e => setSelectedModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])}
              className="text-xs rounded-lg px-3 py-1.5 font-medium"
              style={{ background: '#1e293b', border: `1px solid ${PROVIDER_COLORS[selectedModel.provider]}44`, color: PROVIDER_COLORS[selectedModel.provider] }}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg" style={{ background: '#1e293b', color: '#94a3b8' }}>
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="flex flex-1 overflow-hidden rounded-b-2xl" style={{ border: '1px solid rgba(52,124,37,0.15)', borderTop: 'none' }}>

          {/* ── LEFT PANEL: File tree + Chat ── */}
          <div className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0b1220', borderRight: '1px solid #1e2d3d' }}>
            {/* Tab switcher */}
            <div className="flex" style={{ borderBottom: '1px solid #1e2d3d' }}>
              {(['chat', 'tree'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: activeTab === tab ? 'rgba(52,124,37,0.12)' : 'transparent',
                    color: activeTab === tab ? '#4ade80' : '#475569',
                    borderBottom: activeTab === tab ? '2px solid #347c25' : '2px solid transparent',
                  }}
                >
                  {tab === 'chat' ? <Bot size={12} /> : <Folder size={12} />}
                  {tab === 'chat' ? 'Chat' : 'Files'}
                </button>
              ))}
            </div>

            {/* Chat panel */}
            {activeTab === 'chat' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[95%] rounded-xl p-2.5"
                        style={m.role === 'user'
                          ? { background: 'rgba(52,124,37,0.2)', border: '1px solid rgba(52,124,37,0.3)' }
                          : { background: '#1e293b', border: '1px solid #334155' }
                        }
                      >
                        {m.role === 'assistant' && i === messages.length - 1 && streaming && !m.content
                          ? <div className="flex gap-1 p-1">
                              {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#4ade80', animationDelay: `${j * 0.15}s` }} />)}
                            </div>
                          : <MessageContent content={m.content} />
                        }
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick prompts */}
                {messages.length === 1 && (
                  <div className="px-3 pb-2 space-y-1">
                    {quickPrompts.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-colors"
                        style={{ background: 'rgba(52,124,37,0.06)', color: '#64748b', border: '1px solid #1e293b' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ade80'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-2" style={{ borderTop: '1px solid #1e2d3d' }}>
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                      placeholder="Ask iTango anything…"
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-xl text-xs resize-none"
                      style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || streaming}
                      className="p-2 rounded-xl flex-shrink-0"
                      style={{ background: streaming ? '#166534' : '#347c25', color: 'white' }}
                    >
                      {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* File tree panel */}
            {activeTab === 'tree' && (
              <div className="flex-1 overflow-y-auto py-2">
                {treeRoot.length === 0
                  ? <div className="p-4 text-xs text-slate-600 text-center">
                      <Folder size={24} className="mx-auto mb-2 opacity-30" />
                      {process.env.VITE_GITHUB_TOKEN !== undefined
                        ? 'Loading…'
                        : 'Add GITHUB_TOKEN to .env to browse files'}
                    </div>
                  : renderTree(treeRoot)
                }
              </div>
            )}
          </div>

          {/* ── CENTER + RIGHT: Editor / Preview ── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0d1117' }}>
            {/* Tab bar */}
            <div className="flex items-center justify-between px-4" style={{ background: '#161b22', borderBottom: '1px solid #30363d', height: '40px' }}>
              <div className="flex">
                {[
                  { id: 'editor', label: 'Code Editor', icon: Code2 },
                  { id: 'preview', label: 'Live Preview', icon: Globe },
                  { id: 'activity', label: 'Activity Log', icon: Activity },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id as any)}
                    className="flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors"
                    style={{
                      color: rightTab === tab.id ? '#e6edf3' : '#8b949e',
                      borderBottom: rightTab === tab.id ? '2px solid #347c25' : '2px solid transparent',
                    }}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>
              {selectedFile && (
                <span className="text-[10px] font-mono" style={{ color: '#58a6ff' }}>
                  {selectedFile.path} {isDirty && <span style={{ color: '#fb923c' }}>●</span>}
                </span>
              )}
            </div>

            {/* Code editor tab */}
            {rightTab === 'editor' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {!selectedFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center" style={{ color: '#30363d' }}>
                    <Code2 size={48} className="mb-4 opacity-30" />
                    <p className="text-sm">Select a file from the tree to edit</p>
                    <p className="text-xs mt-1 opacity-50">Or ask iTango AI to show you a file</p>
                  </div>
                ) : fileLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin" style={{ color: '#347c25' }} />
                  </div>
                ) : (
                  <>
                    {/* Analysis bar */}
                    <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                      <span className="text-[10px] text-slate-500 mr-1">AI Analyze:</span>
                      {(['general', 'seo', 'security', 'performance'] as AnalysisType[]).map(t => (
                        <button
                          key={t}
                          onClick={() => handleAnalyze(t)}
                          disabled={analysisLoading}
                          className="text-[10px] px-2 py-1 rounded font-medium capitalize transition-colors"
                          style={{ background: 'rgba(52,124,37,0.08)', color: '#64748b', border: '1px solid #1e293b' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ade80'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                        >
                          {analysisLoading && <Loader2 size={9} className="inline animate-spin mr-1" />}
                          {t === 'general' ? '🔍' : t === 'seo' ? '📈' : t === 'security' ? '🛡' : '⚡'} {t}
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => { setEditedContent(fileContent); setIsDirty(false); }}
                          className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                          style={{ color: '#6b7280' }}
                          title="Reset changes"
                        >
                          <RotateCcw size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Code textarea */}
                    <textarea
                      value={editedContent}
                      onChange={e => { setEditedContent(e.target.value); setIsDirty(e.target.value !== fileContent); }}
                      spellCheck={false}
                      className="flex-1 p-4 text-xs font-mono resize-none outline-none"
                      style={{
                        background: '#0d1117', color: '#e6edf3',
                        lineHeight: '1.6', tabSize: 2,
                      }}
                    />
                  </>
                )}
              </div>
            )}

            {/* Live preview tab */}
            {rightTab === 'preview' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                  <Globe size={12} style={{ color: '#58a6ff' }} />
                  <span className="text-xs font-mono" style={{ color: '#8b949e' }}>https://www.mayobebros.com</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => { const f = document.getElementById('site-preview') as HTMLIFrameElement; if (f) f.src = f.src; }}
                      className="text-[10px] flex items-center gap-1 px-2 py-1 rounded"
                      style={{ background: '#1e293b', color: '#8b949e' }}
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  </div>
                </div>
                <iframe
                  id="site-preview"
                  src="https://www.mayobebros.com"
                  className="flex-1 w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Site Preview"
                />
              </div>
            )}

            {/* Activity log tab */}
            {rightTab === 'activity' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield size={14} className="text-green-400" /> Security Activity Log
                  </h3>
                  <button
                    onClick={() => itangoFetch('/api/itango/activity', { credentials: 'include' }).then(r => r.json()).then(d => setActivityLog(d.log || []))}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded"
                    style={{ background: '#1e293b', color: '#8b949e' }}
                  >
                    <RefreshCw size={10} /> Refresh
                  </button>
                </div>
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <Activity size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No activity yet</p>
                  </div>
                ) : activityLog.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: entry.risk === 'high' ? 'rgba(239,68,68,0.08)' : entry.risk === 'medium' ? 'rgba(251,146,60,0.08)' : '#1e293b',
                      border: `1px solid ${entry.risk === 'high' ? 'rgba(239,68,68,0.2)' : entry.risk === 'medium' ? 'rgba(251,146,60,0.2)' : '#334155'}`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.risk === 'high' ? '#ef4444' : entry.risk === 'medium' ? '#fb923c' : '#4ade80' }} />
                    <span className="font-mono font-bold" style={{ color: '#58a6ff', minWidth: '110px' }}>{entry.action}</span>
                    <span style={{ color: '#8b949e' }} className="truncate">{entry.detail}</span>
                    <span className="ml-auto text-slate-600 flex-shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 mt-2 rounded-xl flex-shrink-0"
          style={{ background: '#0b1220', border: '1px solid #1e2d3d' }}
        >
          <Terminal size={14} style={{ color: '#347c25' }} />
          <span className="text-xs font-bold text-white">Actions:</span>

          <button
            onClick={() => handleAnalyze('general')}
            disabled={!selectedFile || analysisLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', opacity: !selectedFile ? 0.5 : 1 }}
          >
            <Search size={12} /> Analyze File
          </button>

          <button
            onClick={() => setRightTab('preview')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)' }}
          >
            <Eye size={12} /> Preview Site
          </button>

          <button
            onClick={() => setShowCommitModal(true)}
            disabled={!isDirty || !selectedFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity"
            style={{ background: 'rgba(52,124,37,0.2)', color: '#4ade80', border: '1px solid rgba(52,124,37,0.35)', opacity: !isDirty ? 0.5 : 1 }}
          >
            <GitCommit size={12} /> Commit Changes
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleDeploy('preview')}
              disabled={deployLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
            >
              {deployLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Deploy Preview
            </button>
            <button
              onClick={() => {
                if (confirm('Deploy to PRODUCTION? This will update the live website immediately.')) {
                  handleDeploy('production');
                }
              }}
              disabled={deployLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Lock size={12} /> Deploy Production
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCommitModal && selectedFile && (
        <CommitModal
          filePath={selectedFile.path}
          onConfirm={handleCommit}
          onCancel={() => setShowCommitModal(false)}
          loading={commitLoading}
        />
      )}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium"
          style={{
            background: toast.type === 'success' ? '#166534' : '#7f1d1d',
            border: `1px solid ${toast.type === 'success' ? '#16a34a' : '#dc2626'}`,
            color: toast.type === 'success' ? '#4ade80' : '#fca5a5',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
