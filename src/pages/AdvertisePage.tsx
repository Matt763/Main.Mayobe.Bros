import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Send, CheckCircle, CreditCard, X, Megaphone, BarChart3, Users, Globe } from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { applyMeta, buildStaticMeta } from '../lib/seo';

type PaymentMethod = 'stripe' | 'skrill' | 'mobile';

interface AdPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

const AD_PACKAGES: AdPackage[] = [
  {
    id: 'basic',
    name: 'Basic Banner',
    price: 29.99,
    duration: '7 days',
    features: ['Sidebar banner ad', 'Up to 10,000 impressions', 'Basic analytics'],
  },
  {
    id: 'standard',
    name: 'Standard Placement',
    price: 79.99,
    duration: '30 days',
    features: ['In-article ad placement', 'Up to 50,000 impressions', 'Detailed analytics', 'A/B testing'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium Sponsorship',
    price: 199.99,
    duration: '30 days',
    features: ['Homepage featured spot', 'Unlimited impressions', 'Full analytics dashboard', 'Sponsored content option', 'Social media mention'],
  },
];

function PaymentModal({
  isOpen,
  onClose,
  selectedPackage,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: AdPackage | null;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
      setProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || !selectedPackage) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/premium/ad-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          userName: name,
          amount: selectedPackage.price,
          paymentMethod,
          adPackage: selectedPackage.id,
          transactionId: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Payment processing failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Thank you for advertising with Mayobe Bros. Your {selectedPackage.name} campaign will be activated shortly.
          </p>
          <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Complete Payment</h3>
            <p className="text-blue-100 text-sm">{selectedPackage.name} - ${selectedPackage.price}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handlePayment} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'stripe' as PaymentMethod, label: 'Stripe' },
                { key: 'skrill' as PaymentMethod, label: 'Skrill' },
                { key: 'mobile' as PaymentMethod, label: 'Mobile Money' },
              ]).map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    paymentMethod === m.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{selectedPackage.name}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">${selectedPackage.price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
              <span className="text-sm text-gray-900 dark:text-white">{selectedPackage.duration}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard size={18} />
                Pay ${selectedPackage.price}
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Secure payment processed by {paymentMethod === 'stripe' ? 'Stripe' : paymentMethod === 'skrill' ? 'Skrill' : 'Mobile Money'}
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AdvertisePage() {
  useEffect(() => {
    applyMeta(buildStaticMeta(
      'Advertise With Us',
      'Reach a highly engaged audience by advertising on Mayobe Bros. Learn about our advertising packages and how to partner with us.',
      '/advertise',
    ));
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.contact.submit({ ...formData, type: 'advertising' });
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openPayment = (pkg: AdPackage) => {
    setSelectedPackage(pkg);
    setPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} selectedPackage={selectedPackage} />

      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 backdrop-blur-sm">
            <Megaphone size={14} /> Advertising
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            Advertise With<br />Mayobe Bros
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Reach thousands of engaged readers across Tanzania and beyond with targeted advertising packages.
          </p>
          <button
            onClick={() => openPayment(AD_PACKAGES[1])}
            className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-xl inline-flex items-center gap-3"
          >
            <CreditCard size={22} />
            PAY FOR ADVERTISEMENT
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Users, label: 'Monthly Readers', value: '50K+' },
            { icon: Globe, label: 'Countries Reached', value: '30+' },
            { icon: BarChart3, label: 'Avg. Engagement', value: '4.2min' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 text-center border border-gray-100 dark:border-gray-700">
              <stat.icon size={24} className="text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="container mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3">Advertising Packages</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Choose the package that fits your needs. All packages include performance analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AD_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                pkg.popular
                  ? 'border-blue-600 dark:border-blue-500'
                  : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pkg.duration}</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">${pkg.price}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openPayment(pkg)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <CreditCard size={16} />
                PAY FOR ADVERTISEMENT
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Advertise + Contact Form */}
      <section className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Why Advertise With Us?</h2>
            <div className="space-y-4 sm:space-y-6">
              {[
                { num: 1, title: 'Targeted Audience', desc: 'Connect with readers interested in education, business, technology, gaming, and more.' },
                { num: 2, title: 'Multiple Ad Formats', desc: 'Choose from banner ads, sponsored content, native advertising, and more.' },
                { num: 3, title: 'Measurable Results', desc: 'Track your campaign performance with detailed analytics and reporting.' },
                { num: 4, title: 'Flexible Packages', desc: 'Custom advertising solutions to fit any budget and marketing goals.' },
              ].map(item => (
                <div key={item.num} className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                    {item.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Get in Touch</h2>
            {isSubmitted ? (
              <div className="text-center py-6 sm:py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">We've received your inquiry and will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[44px]"
                    placeholder="John Doe" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[44px]"
                    placeholder="john@example.com" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input type="text" id="subject" name="subject" required value={formData.subject} onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[44px]"
                    placeholder="Advertising Inquiry" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                  <textarea id="message" name="message" required rows={5} value={formData.message} onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    placeholder="Tell us about your advertising needs..." />
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:bg-gray-400 min-h-[44px]">
                  {isSubmitting ? 'Sending...' : (<><Send size={18} /> Send Message</>)}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 text-center border border-blue-100 dark:border-gray-700">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact Information</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">For advertising inquiries, you can also reach us directly at:</p>
          <a href="mailto:info@mayobebros.com" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
            info@mayobebros.com
          </a>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share this page</span>
          <SocialShare title="Advertise on Mayobe Bros" description="Promote your brand on Mayobe Bros and reach a highly engaged audience." />
        </div>
      </section>
    </div>
  );
}
