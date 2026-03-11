import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, Database, RefreshCw, AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function FactCheckingPolicyPage() {
  useEffect(() => {
    applyMeta(buildStaticMeta(
      'Fact Checking Policy — MayobeBros',
      'Learn how MayobeBros verifies information before publication, our sources of information, and our commitment to accuracy and truth.',
      '/fact-checking-policy',
    ));
  }, []);

  const sources = [
    { category: 'Government & Official', examples: ['Tanzania Revenue Authority (TRA)', 'National Bureau of Statistics (NBS)', 'Bank of Tanzania (BOT)', 'Official government websites and press releases'] },
    { category: 'International Organizations', examples: ['World Bank', 'International Monetary Fund (IMF)', 'United Nations agencies', 'African Development Bank'] },
    { category: 'Academic & Research', examples: ['Peer-reviewed academic journals', 'University research publications', 'Think tanks and policy institutes', 'Published research papers'] },
    { category: 'News Organizations', examples: ['Established national and international news outlets', 'Wire services (Reuters, AP, AFP)', 'Reputable regional media organizations'] },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Shield size={14} />
            Accuracy & Trust
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            Fact Checking Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
            Accuracy is the foundation of our journalism. This policy explains how we verify information,
            where we source our facts, and what we do when we get something wrong.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">

          <section className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 sm:p-8 border border-green-100 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Our Commitment to Accuracy</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  MayobeBros is committed to publishing only verified, accurate information. Every factual claim in our
                  articles is checked against reliable sources before publication. We believe our readers deserve
                  truthful, well-researched content they can trust.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Verification Process</h2>
            </div>
            <div className="pl-14 space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Our fact-checking follows a systematic process before any article reaches our readers:
              </p>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Identify Claims',
                    desc: 'Writers identify all factual claims, statistics, quotes, and assertions in their drafts that require verification.',
                    color: 'bg-blue-600',
                  },
                  {
                    step: '2',
                    title: 'Source Collection',
                    desc: 'Each claim is matched to at least one credible, authoritative source. Preference is given to primary sources.',
                    color: 'bg-green-600',
                  },
                  {
                    step: '3',
                    title: 'Cross-Reference',
                    desc: 'Important facts are verified against at least two independent sources to confirm accuracy.',
                    color: 'bg-yellow-600',
                  },
                  {
                    step: '4',
                    title: 'Expert Consultation',
                    desc: 'For complex or technical claims, subject matter experts may be consulted for clarification.',
                    color: 'bg-orange-600',
                  },
                  {
                    step: '5',
                    title: 'Editor Review',
                    desc: 'The editor independently reviews sourced claims before approving publication.',
                    color: 'bg-red-600',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                    <div className={`w-7 h-7 ${item.color} text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Database size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Our Sources of Information</h2>
            </div>
            <div className="pl-14">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                We rely on a diverse range of credible sources to ensure our information is accurate and well-rounded:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sources.map((source) => (
                  <div key={source.category} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{source.category}</h3>
                    <ul className="space-y-1">
                      {source.examples.map((ex) => (
                        <li key={ex} className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">•</span>
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">What We Do Not Publish</h2>
            </div>
            <div className="pl-14">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                To maintain the trust of our readers, we have strict standards on what we will not publish:
              </p>
              <ul className="space-y-2">
                {[
                  'Unverified rumors, gossip, or hearsay without reliable sourcing.',
                  'Statistics or claims from unknown or unverified sources.',
                  'Information sourced solely from social media without independent verification.',
                  'Misleading headlines that do not accurately represent the article content.',
                  'Content that promotes discrimination, violence, or illegal activity.',
                  'Fabricated quotes or misattributed statements.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <RefreshCw size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Corrections and Updates</h2>
            </div>
            <div className="pl-14 space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We believe in transparency when we make mistakes. Our correction policy is as follows:
              </p>
              <div className="space-y-3">
                {[
                  {
                    type: 'Minor Correction',
                    desc: 'Spelling, grammar, or formatting errors are corrected immediately without a public notice.',
                    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  },
                  {
                    type: 'Factual Correction',
                    desc: 'When a factual error is identified, a correction note is added at the top of the article stating what was incorrect and what the correct information is.',
                    badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                  },
                  {
                    type: 'Major Revision',
                    desc: 'If an article requires substantial changes due to incorrect information, the article is updated with a revision notice showing the original publish date and the revision date.',
                    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                  },
                  {
                    type: 'Reader-Submitted Corrections',
                    desc: 'We welcome corrections from our readers. If you spot an error, please contact our editorial team. We review all submissions and respond promptly.',
                    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                  },
                ].map((item) => (
                  <div key={item.type} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.badge} mb-2`}>
                      {item.type}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Report an Inaccuracy</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Found something that doesn't seem right? Help us maintain our high standards of accuracy by reporting it to our editorial team.
              We take all reports seriously and investigate promptly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                Report an Error
              </Link>
              <Link
                to="/editorial-policy"
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                Editorial Policy
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
