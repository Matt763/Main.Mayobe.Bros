import { useEffect } from 'react';
import { Shield, Eye, Lock, Cookie, Link as LinkIcon, UserCheck, Baby, FileText, Mail } from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    applyMeta(buildStaticMeta(
      'Privacy Policy',
      'Read the Mayobe Bros Privacy Policy to understand how we collect, use, and protect your personal information.',
      '/privacy-policy',
    ));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg sm:text-xl text-blue-100">Your privacy is important to us</p>
            <p className="text-sm sm:text-base text-blue-200 mt-4">Last Updated: February 11, 2026</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 dark:bg-gray-900 border-l-4 border-blue-600 p-4 sm:p-6 mb-8 sm:mb-12 rounded-r-lg">
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              At Mayobe Bros, we are committed to protecting your privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
              and use our services.
            </p>
          </div>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">1. Information We Collect</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">The types of information we gather from our users</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>Subscribe to our newsletter</li>
                  <li>Submit a contact form</li>
                  <li>Comment on our articles</li>
                  <li>Create an account on our platform</li>
                  <li>Participate in surveys or promotions</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3 text-sm sm:text-base">
                  This information may include your name, email address, phone number, and any other information you choose to provide.
                </p>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Automatically Collected Information</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                  When you visit our website, we automatically collect certain information about your device, including:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                  <li>IP address and browser type</li>
                  <li>Operating system and device information</li>
                  <li>Pages visited and time spent on each page</li>
                  <li>Referring website addresses</li>
                  <li>Click-stream data and interaction patterns</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">The purposes for which we process your data</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Providing, maintaining, and improving our services</li>
                <li>Sending you newsletters, updates, and promotional content (with your consent)</li>
                <li>Responding to your inquiries and providing customer support</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Detecting, preventing, and addressing technical issues and security threats</li>
                <li>Complying with legal obligations and enforcing our terms of service</li>
                <li>Personalizing content and recommendations based on your interests</li>
              </ul>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">3. Data Security</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">How we protect your information</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We implement appropriate technical and organizational security measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Encryption of data in transit and at rest using industry-standard protocols</li>
                <li>Regular security assessments and vulnerability testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure hosting infrastructure with reputable service providers</li>
                <li>Employee training on data protection best practices</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                However, please note that no method of transmission over the internet or electronic storage is 100% secure.
                While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">4. Cookies and Tracking Technologies</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">How we use cookies on our website</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We use cookies and similar tracking technologies to track activity on our website and store certain information.
                Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Types of Cookies We Use:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
                </ul>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not
                accept cookies, you may not be able to use some portions of our website.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">5. Third-Party Services and Links</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">External services and websites we interact with</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Our website may contain links to third-party websites and services that are not operated by us. We use various
                third-party services to enhance our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li><strong>Analytics:</strong> Google Analytics for website traffic analysis</li>
                <li><strong>Hosting:</strong> Cloud service providers for data storage and hosting</li>
                <li><strong>Email Services:</strong> Third-party email service providers for newsletters</li>
                <li><strong>Social Media:</strong> Social media platforms for content sharing</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                We strongly advise you to review the privacy policies of any third-party sites you visit. We have no control over and
                assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">6. Your Rights and Choices</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Control over your personal information</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li><strong>Right to Access:</strong> Request copies of your personal information</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Right to Object:</strong> Object to our processing of your personal information</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                To exercise any of these rights, please contact us using the information provided at the end of this policy.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">7. Children's Privacy</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Protection of minors' information</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Our website is not intended for children under the age of 13. We do not knowingly collect personally identifiable
                information from children under 13. If you are a parent or guardian and you are aware that your child has provided us
                with personal information, please contact us immediately.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                If we become aware that we have collected personal information from children without verification of parental consent,
                we will take steps to remove that information from our servers.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">8. Changes to This Privacy Policy</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">How we communicate updates</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                We may update our Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements,
                or other factors. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base ml-4">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date at the top of this policy</li>
                <li>Sending you an email notification (if you have subscribed to our newsletter)</li>
                <li>Displaying a prominent notice on our website</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 text-sm sm:text-base">
                We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
              </p>
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">9. Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Get in touch with questions or concerns</p>
              </div>
            </div>
            <div className="ml-0 sm:ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg mt-4">
                <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <p><strong>Email:</strong> info@mayobebros.com</p>
                  <p><strong>Website:</strong> www.mayobebros.com</p>
                  <p><strong>Response Time:</strong> We aim to respond to all inquiries within 48 hours</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-gray-700 p-4 sm:p-6 rounded-lg mt-8 sm:mt-12">
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed text-center">
              By using our website, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
              If you do not agree with this policy, please discontinue use of our website immediately.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share this page</span>
            <SocialShare title="Privacy Policy — Mayobe Bros" description="Read Mayobe Bros privacy policy to understand how we collect, use, and protect your personal information." />
          </div>
        </div>
      </div>
    </div>
  );
}
