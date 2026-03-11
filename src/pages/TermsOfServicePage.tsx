import { useEffect } from 'react';
import { FileText, UserCheck, Shield, AlertTriangle, Ban, Scale, XCircle, RefreshCw, Mail } from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    applyMeta(buildStaticMeta(
      'Terms of Service',
      'Read the Mayobe Bros Terms of Service to understand the rules and guidelines for using our platform.',
      '/terms-of-service',
    ));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-800 dark:to-black text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg sm:text-xl text-gray-200">Legal agreement governing your use of our platform</p>
            <p className="text-sm sm:text-base text-gray-300 mt-4">Last Updated: February 11, 2026</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-gray-900 border-l-4 border-yellow-500 p-4 sm:p-6 mb-8 sm:mb-12 rounded-r-lg">
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              <strong className="text-yellow-800 dark:text-yellow-500">Important Notice:</strong> Please read these Terms of Service
              carefully before using the Mayobe Bros website and services. By accessing or using our platform, you agree to be bound by
              these terms. If you disagree with any part of these terms, you may not access the service.
            </p>
          </div>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Agreement to these terms and conditions</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                By accessing and using Mayobe Bros (the "Service"), you accept and agree to be bound by the terms and provisions of
                this agreement. These Terms of Service constitute a legally binding agreement between you and Mayobe Bros.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the
                authority to bind such entity to these terms. In such case, "you" and "your" will refer to that entity.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <strong>By using our Service, you confirm that:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>You are at least 13 years of age</li>
                  <li>You have the legal capacity to enter into this agreement</li>
                  <li>You will comply with all applicable laws and regulations</li>
                  <li>You have read and understood these Terms of Service</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">2. User Accounts</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Account creation and security responsibilities</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                When you create an account with us, you must provide accurate, complete, and current information. Failure to do so
                constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Account Security</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">You are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>Maintaining the confidentiality of your account password</li>
                  <li>Restricting access to your computer and account</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access or security breach</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3 text-sm sm:text-base">
                  We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion, especially
                  if we believe you have violated these Terms of Service.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">3. Content Guidelines</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Standards for user-generated content</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics,
                or other material. You are responsible for the content you post on or through the Service.
              </p>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Content Standards</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  By posting content, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>The content is yours or you have the right to use it</li>
                  <li>The posting of your content does not violate any privacy rights or intellectual property rights</li>
                  <li>Your content does not contain harmful, offensive, or illegal material</li>
                  <li>Your content complies with all applicable laws and regulations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Content License</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  By posting content to our Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
                  modify, adapt, publish, and display such content on our platform and in our marketing materials. You retain all
                  ownership rights to your content.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">4. Intellectual Property Rights</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Ownership of platform content and materials</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                The Service and its original content (excluding user-generated content), features, and functionality are and will
                remain the exclusive property of Mayobe Bros and its licensors. The Service is protected by copyright, trademark,
                and other laws of both domestic and foreign countries.
              </p>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Trademarks</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  Mayobe Bros name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks
                  of Mayobe Bros or its affiliates. You may not use such marks without our prior written permission.
                </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Copyright Infringement</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  We respect the intellectual property rights of others. If you believe that any content on our Service infringes your
                  copyright, please contact us with detailed information about the alleged infringement.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">5. Prohibited Activities</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Activities that are not permitted on our platform</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Copying, distributing, or disclosing any part of the Service in any medium</li>
                <li>Using any automated system to access the Service in a manner that sends more requests than a human can reasonably produce</li>
                <li>Transmitting spam, chain letters, or other unsolicited communications</li>
                <li>Attempting to interfere with, compromise, or damage the Service or its infrastructure</li>
                <li>Collecting or harvesting any personally identifiable information from the Service</li>
                <li>Using the Service for any illegal or unauthorized purpose</li>
                <li>Impersonating another person or entity</li>
                <li>Posting content that is defamatory, obscene, abusive, threatening, or hateful</li>
                <li>Violating any applicable laws, regulations, or third-party rights</li>
                <li>Attempting to gain unauthorized access to other users' accounts or data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                Violation of these prohibitions may result in immediate termination of your account and possible legal action.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">6. Disclaimer of Warranties and Limitation of Liability</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Service warranties and liability limitations</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Disclaimer of Warranties</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>The accuracy, reliability, or completeness of any content or information</li>
                  <li>The uninterrupted or error-free operation of the Service</li>
                  <li>The security of data transmitted through the Service</li>
                  <li>The fitness of the Service for any particular purpose</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Limitation of Liability</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  To the maximum extent permitted by law, Mayobe Bros shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly,
                  or any loss of data, use, goodwill, or other intangible losses resulting from:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>Your access to or use of (or inability to access or use) the Service</li>
                  <li>Any conduct or content of any third party on the Service</li>
                  <li>Any content obtained from the Service</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">7. Termination</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Account termination and suspension</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability,
                under our sole discretion, for any reason whatsoever, including without limitation:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Breach of these Terms of Service</li>
                <li>Violation of applicable laws or regulations</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>At your request</li>
                <li>Technical or security reasons</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you
                may simply discontinue using the Service or contact us to delete your account.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                All provisions of the Terms which by their nature should survive termination shall survive, including ownership
                provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">8. Governing Law and Jurisdiction</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Legal framework governing these terms</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Mayobe Bros
                operates, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any
                provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions will remain in effect.
              </p>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Dispute Resolution</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  In the event of any dispute arising out of or relating to these Terms, you agree to first attempt to resolve the
                  dispute informally by contacting us. If the dispute cannot be resolved within 30 days, either party may pursue
                  formal legal proceedings.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">9. Changes to Terms</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">How we update these terms</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We reserve the right to modify or replace these Terms at any time at our sole discretion. We will provide notice of
                material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending notification via email (if you have an account)</li>
                <li>Displaying a prominent notice on our website</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.
                You are expected to check this page periodically so you are aware of any changes.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">10. Contact Information</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Get in touch with questions about these terms</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg mt-4">
                <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <p><strong>Email:</strong> info@mayobebros.com</p>
                  <p><strong>Website:</strong> www.mayobebros.com</p>
                  <p><strong>Response Time:</strong> We aim to respond to all legal inquiries within 72 hours</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-gray-900 dark:bg-gray-800 text-white p-4 sm:p-6 rounded-lg mt-8 sm:mt-12">
            <p className="text-sm sm:text-base leading-relaxed text-center">
              These Terms of Service constitute the entire agreement between you and Mayobe Bros regarding the use of the Service.
              By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share this page</span>
            <SocialShare title="Terms of Service — Mayobe Bros" description="Read the Mayobe Bros terms of service governing your use of our website and content." />
          </div>
        </div>
      </div>
    </div>
  );
}
