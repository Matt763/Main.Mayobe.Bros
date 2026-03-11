import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, CheckCircle, FileText, Users, AlertCircle, RotateCcw, Shield } from 'lucide-react';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function EditorialPolicyPage() {
  useEffect(() => {
    applyMeta(buildStaticMeta(
      'Editorial Policy — MayobeBros',
      'Learn how MayobeBros researches, writes, edits, and publishes content. Our editorial standards ensure accuracy, transparency, and quality journalism.',
      '/editorial-policy',
    ));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Shield size={14} />
            Editorial Standards
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            Editorial Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
            At MayobeBros, we are committed to delivering accurate, trustworthy, and original content.
            This policy outlines how we create, verify, and publish every article on our platform.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">

          <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Editorial Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  MayobeBros publishes content that informs, educates, and empowers readers across East Africa and beyond.
                  We cover business ideas, technology, lifestyle, sports, entertainment, and more — always with a
                  commitment to quality, balance, and integrity.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">How We Research Content</h2>
            </div>
            <div className="pl-14 space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Every article begins with thorough research. Our writers and editors follow a structured process:
              </p>
              <ul className="space-y-2">
                {[
                  'Topics are selected based on reader interest, trending searches, and editorial judgment.',
                  'Writers consult multiple primary and secondary sources before writing.',
                  'Statistical claims are sourced from reputable institutions, government reports, or peer-reviewed studies.',
                  'Expert opinions are sought where applicable and clearly attributed.',
                  'Writers disclose any conflicts of interest related to the topic.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Writing Standards</h2>
            </div>
            <div className="pl-14 space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                All content published on MayobeBros adheres to the following standards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Originality', desc: 'All articles are written from scratch. Plagiarism is strictly prohibited.' },
                  { title: 'Clarity', desc: 'We write in plain, accessible language suitable for all reading levels.' },
                  { title: 'Structure', desc: 'Articles include a clear title, introduction, subheadings, body, and conclusion.' },
                  { title: 'Balance', desc: 'We present multiple perspectives on controversial topics.' },
                  { title: 'Accuracy', desc: 'Facts are verified before publication. Errors are corrected promptly.' },
                  { title: 'Attribution', desc: 'Sources, quotes, and data are properly attributed.' },
                ].map((item) => (
                  <div key={item.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Editorial Review Process</h2>
            </div>
            <div className="pl-14">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Before any article is published, it goes through our multi-stage editorial review process:
              </p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Draft Submission', desc: 'Writer submits a complete draft for editorial review.' },
                  { step: '2', title: 'Content Review', desc: 'Editor checks for accuracy, completeness, and adherence to editorial standards.' },
                  { step: '3', title: 'Fact Verification', desc: 'Key facts, statistics, and claims are independently verified.' },
                  { step: '4', title: 'Copy Editing', desc: 'Grammar, spelling, punctuation, and style are refined.' },
                  { step: '5', title: 'SEO Review', desc: 'Titles, descriptions, and headings are optimized for discoverability.' },
                  { step: '6', title: 'Final Approval', desc: 'Senior editor or publisher gives final approval before publication.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
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
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Preventing Misinformation</h2>
            </div>
            <div className="pl-14 space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We take misinformation seriously. The following practices are in place to protect our readers:
              </p>
              <ul className="space-y-2">
                {[
                  'Unverified claims are not published until confirmed by reliable sources.',
                  'Sensational or clickbait headlines are not permitted.',
                  'AI-generated content is always reviewed and edited by a human editor before publication.',
                  'Opinion content is clearly labeled as "Opinion" and does not misrepresent facts.',
                  'Sponsored content is clearly labeled as "Sponsored" or "Advertorial".',
                  'Social media posts and rumors are not used as sole sources.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <RotateCcw size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">Corrections Policy</h2>
            </div>
            <div className="pl-14">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                When errors are identified, we act quickly to correct them:
              </p>
              <ul className="space-y-2">
                {[
                  'Minor corrections (spelling, grammar) are made silently.',
                  'Factual errors are corrected with a visible correction note at the top of the article.',
                  'Significant changes that alter the meaning of an article are noted with the date of revision.',
                  'We acknowledge corrections submitted by readers and credit them where appropriate.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 sm:p-8 border border-blue-100 dark:border-blue-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Questions About Our Editorial Process?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have concerns about our content or wish to report an error, we welcome your feedback.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Contact Our Editorial Team
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}
