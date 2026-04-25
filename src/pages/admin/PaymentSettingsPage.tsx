import { useState, useEffect } from 'react';
import { CreditCard, Shield, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

interface GatewayConfig {
  gateway: string;
  is_enabled: boolean;
  config: Record<string, string>;
}

const GATEWAYS = [
  {
    key: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    description: 'Accept credit/debit card payments worldwide',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_test_...' },
      { key: 'mode', label: 'Mode', placeholder: 'test or live' },
    ],
  },
  {
    key: 'skrill',
    name: 'Skrill',
    icon: Shield,
    description: 'Online wallet and money transfer service',
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400',
    fields: [
      { key: 'merchant_email', label: 'Merchant Email', placeholder: 'your@email.com' },
      { key: 'mode', label: 'Mode', placeholder: 'test or live' },
    ],
  },
  {
    key: 'mobile_money',
    name: 'Mobile Money',
    icon: Smartphone,
    description: 'M-Pesa, Mixx by Yas, Airtel Money, HaloPesa',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    fields: [
      { key: 'provider', label: 'Provider', placeholder: 'mpesa, yas, airtel, halopesa' },
      { key: 'mode', label: 'Mode', placeholder: 'test or live' },
    ],
  },
];

export default function PaymentSettingsPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editConfigs, setEditConfigs] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      const { data } = await supabase.from('payment_gateway_settings').select('*');
      const configs: GatewayConfig[] = (data || []).map((d: any) => ({
        gateway: d.gateway,
        is_enabled: d.is_enabled,
        config: typeof d.config === 'string' ? JSON.parse(d.config) : d.config || {},
      }));
      setGateways(configs);

      const edits: Record<string, Record<string, string>> = {};
      configs.forEach(c => { edits[c.gateway] = { ...c.config }; });
      GATEWAYS.forEach(g => {
        if (!edits[g.key]) edits[g.key] = {};
      });
      setEditConfigs(edits);
    } catch (err) {
      console.error('Error loading gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (gatewayKey: string) => {
    const current = gateways.find(g => g.gateway === gatewayKey);
    const newEnabled = !(current?.is_enabled);

    setSaving(gatewayKey);
    try {
      await supabase
        .from('payment_gateway_settings')
        .update({ is_enabled: newEnabled, updated_at: new Date().toISOString() })
        .eq('gateway', gatewayKey);

      setGateways(prev => prev.map(g =>
        g.gateway === gatewayKey ? { ...g, is_enabled: newEnabled } : g
      ));
    } finally {
      setSaving(null);
    }
  };

  const saveConfig = async (gatewayKey: string) => {
    setSaving(gatewayKey);
    try {
      const config = editConfigs[gatewayKey] || {};
      await supabase
        .from('payment_gateway_settings')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('gateway', gatewayKey);

      setSuccess(gatewayKey);
      setTimeout(() => setSuccess(null), 3000);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (gateway: string, field: string, value: string) => {
    setEditConfigs(prev => ({
      ...prev,
      [gateway]: { ...(prev[gateway] || {}), [field]: value },
    }));
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard size={24} className="text-green-600" />
            Payment Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure payment gateways for premium content and advertising payments.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {GATEWAYS.map(gw => {
              const config = gateways.find(g => g.gateway === gw.key);
              const isEnabled = config?.is_enabled || false;
              const Icon = gw.icon;

              return (
                <div
                  key={gw.key}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 transition-all ${
                    isEnabled ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gw.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{gw.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{gw.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleGateway(gw.key)}
                      disabled={saving === gw.key}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {gw.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{field.label}</label>
                        <input
                          type={field.key.includes('key') || field.key.includes('secret') ? 'password' : 'text'}
                          value={editConfigs[gw.key]?.[field.key] || ''}
                          onChange={e => updateField(gw.key, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {isEnabled ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                          <AlertCircle size={12} /> Disabled
                        </span>
                      )}
                      {success === gw.key && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium ml-2">Saved!</span>
                      )}
                    </div>
                    <button
                      onClick={() => saveConfig(gw.key)}
                      disabled={saving === gw.key}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {saving === gw.key ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save Configuration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
