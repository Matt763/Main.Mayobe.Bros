import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Mail, MailOpen, Trash2, Reply, Search, RefreshCw,
  User, AtSign, Tag, Clock, MessageSquare, Filter,
  ChevronLeft, ExternalLink, Inbox,
} from 'lucide-react';

interface AdvertiseMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

type FilterType = 'all' | 'unread' | 'read';

export default function AdvertisingMessagesPage() {
  const [messages, setMessages] = useState<AdvertiseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdvertiseMessage | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('type', 'advertising')
      .order('created_at', { ascending: false });

    if (!error && data) setMessages(data as AdvertiseMessage[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = async (msg: AdvertiseMessage) => {
    if (msg.is_read) return;
    await supabase
      .from('contact_submissions')
      .update({ is_read: true })
      .eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
  };

  const handleSelect = (msg: AdvertiseMessage) => {
    setSelected(msg);
    markAsRead(msg);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('contact_submissions').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
    setConfirmDelete(null);
  };

  const handleReply = (email: string, subject: string) => {
    window.open(`mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`, '_blank');
  };

  const filtered = messages.filter(m => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'unread' ? !m.is_read :
      m.is_read;
    const q = search.toLowerCase();
    const matchesSearch = !q || [m.name, m.email, m.subject, m.message].some(s => s.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (iso: string) => new Date(iso).toLocaleString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Advertising Messages</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All messages read'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchMessages}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Message list panel */}
          <div className={`flex-shrink-0 w-full sm:w-80 lg:w-96 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${selected ? 'hidden sm:flex' : 'flex'}`}>

            {/* Search + filter */}
            <div className="flex-shrink-0 p-3 space-y-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'unread', 'read'] as FilterType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {f}
                    {f === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 text-[10px]">({unreadCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw size={20} className="animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Inbox size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No messages found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {search ? 'Try a different search term' : 'Advertising inquiries will appear here'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => handleSelect(msg)}
                      className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20 ${
                        selected?.id === msg.id ? 'bg-blue-50 dark:bg-blue-950/20 border-r-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${msg.is_read ? 'bg-transparent' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-sm truncate ${msg.is_read ? 'font-normal text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                              {msg.name}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDate(msg.created_at)}</span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${msg.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 leading-snug">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message detail panel */}
          <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden ${selected ? 'flex' : 'hidden sm:flex'}`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center mb-4">
                  <Mail size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-base font-semibold text-gray-600 dark:text-gray-400">Select a message</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Choose an advertising inquiry to view details</p>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setSelected(null)}
                      className="sm:hidden flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mt-0.5"
                    >
                      <ChevronLeft size={16} className="text-gray-500" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{selected.subject}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {selected.is_read
                          ? <span className="inline-flex items-center gap-1 text-xs text-gray-400"><MailOpen size={10} /> Read</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium"><Mail size={10} /> Unread</span>
                        }
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{formatFullDate(selected.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleReply(selected.email, selected.subject)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                        title={`Reply to ${selected.email}`}
                      >
                        <Reply size={12} />
                        Reply
                        <ExternalLink size={10} className="opacity-60" />
                      </button>
                      {confirmDelete === selected.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(selected.id)}
                            disabled={deleting === selected.id}
                            className="px-2.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            {deleting === selected.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(selected.id)}
                          className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 text-gray-500 hover:text-red-600 transition-all"
                          title="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sender info */}
                <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Name</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selected.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <AtSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Email</p>
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        >
                          {selected.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:col-span-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                        <Tag size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Subject</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{selected.subject}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare size={14} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selected.message}
                    </p>
                  </div>

                  {/* Reply CTA */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleReply(selected.email, selected.subject)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Reply size={15} />
                      Reply to {selected.name}
                      <ExternalLink size={12} className="opacity-70" />
                    </button>
                    <a
                      href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <AtSign size={14} />
                      {selected.email}
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">
                    Clicking Reply opens your default email app. The recipient is set to {selected.email}.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
