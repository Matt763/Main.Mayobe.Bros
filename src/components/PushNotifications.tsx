import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PushNotifications() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    const dismissed = localStorage.getItem('push-prompt-dismissed');
    const subscribed = localStorage.getItem('push-subscribed');
    if (dismissed || subscribed) return;

    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('push-subscribed', '1');
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: undefined,
            });
            if (sub) {
              const json = sub.toJSON();
              await supabase.from('push_subscriptions').upsert({
                endpoint: json.endpoint,
                p256dh: json.keys?.p256dh || null,
                auth_key: json.keys?.auth || null,
              }, { onConflict: 'endpoint', ignoreDuplicates: true });
            }
          } catch {
          }
        }
      }
    } catch {
    } finally {
      setRequesting(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-white/10 animate-slide-up">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Bell size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-0.5">Stay updated</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Get notified when new articles are published.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAllow}
              disabled={requesting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {requesting ? 'Setting up...' : 'Allow'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
