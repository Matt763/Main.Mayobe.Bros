import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle, AlertCircle, MessageSquare, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import SocialShare from '../components/SocialShare';
import { applyMeta, buildStaticMeta } from '../lib/seo';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactUsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    applyMeta(buildStaticMeta(
      'Contact Us',
      'Get in touch with the Mayobe Bros team. We would love to hear from you — send us a message and we will respond promptly.',
      '/contact',
    ));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await api.contact.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        type: 'general',
      });

      setSubmitStatus('success');
      setSubmitMessage('Thank you for contacting us! We will get back to you within 24-48 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setSubmitMessage('Sorry, there was an error submitting your message. Please try again or contact us directly via email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: 'How quickly will I receive a response?',
      answer: 'We typically respond to all inquiries within 24-48 hours during business days. For urgent matters, please indicate this in your subject line.'
    },
    {
      question: 'Can I submit article ideas or guest posts?',
      answer: 'Absolutely! We welcome content contributions. Please include "Guest Post" or "Article Idea" in your subject line and provide details about your proposed content.'
    },
    {
      question: 'How do I report a technical issue?',
      answer: 'Please use this contact form with "Technical Issue" in the subject line. Include as much detail as possible about the problem you are experiencing.'
    },
    {
      question: 'Do you offer advertising opportunities?',
      answer: 'Yes! Visit our Advertise page for more information about advertising opportunities and partnerships, or contact us directly with "Advertising" in the subject line.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-700 dark:to-purple-900 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg sm:text-xl text-blue-100">We would love to hear from you. Send us a message and we will respond as soon as possible.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">Send Us a Message</h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-800 dark:text-green-300 font-semibold text-sm sm:text-base">Message Sent Successfully!</p>
                      <p className="text-green-700 dark:text-green-400 text-xs sm:text-sm mt-1">{submitMessage}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 dark:text-red-300 font-semibold text-sm sm:text-base">Error Sending Message</p>
                      <p className="text-red-700 dark:text-red-400 text-xs sm:text-sm mt-1">{submitMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors text-sm sm:text-base`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors text-sm sm:text-base`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.subject
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors text-sm sm:text-base`}
                      placeholder="How can we help you?"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.message
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors resize-none text-sm sm:text-base`}
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base ${
                      isSubmitting ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</div>
                      <a href="mailto:info@mayobebros.com" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm sm:text-base">
                        info@mayobebros.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</div>
                      <a href="tel:+1234567890" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm sm:text-base">
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Address</div>
                      <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                        123 Knowledge Street<br />
                        Innovation City, IC 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-700 dark:to-purple-900 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Business Hours</h3>
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 mt-4">
                  All times are in Eastern Standard Time (EST)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-5 sm:p-6 shadow-md">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">{faq.question}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Did not find what you are looking for? <a href="#contact-form" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Send us a message</a>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share this page</span>
            <SocialShare title="Contact Mayobe Bros — Get in Touch With Us" description="Have a question or want to work with us? Contact the Mayobe Bros team today." />
          </div>
        </div>
      </div>
    </div>
  );
}
