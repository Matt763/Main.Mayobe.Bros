import { useEffect } from 'react';
import { BookOpen, Target, Users, TrendingUp, Lightbulb, Heart, Briefcase, Laptop, Gamepad2, Clock, BookMarked, Trophy } from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { applyMeta, buildStaticMeta } from '../lib/seo';

export default function AboutUsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    applyMeta(buildStaticMeta(
      'About Us',
      'Learn about Mayobe Bros — our mission to empower minds with knowledge, insights, and stories that inspire across education, business, technology, and more.',
      '/about',
    ));
  }, []);

  const stats = [
    { icon: BookMarked, label: 'Articles Published', value: '10,000+', color: 'blue' },
    { icon: Users, label: 'Active Readers', value: '50,000+', color: 'green' },
    { icon: BookOpen, label: 'Content Categories', value: '6+', color: 'purple' },
    { icon: Trophy, label: 'Years of Excellence', value: '5+', color: 'yellow' }
  ];

  const offerings = [
    {
      icon: BookOpen,
      title: 'Education',
      description: 'Comprehensive guides, tutorials, and resources to help you learn and grow in your academic journey.',
      color: 'blue'
    },
    {
      icon: Briefcase,
      title: 'Business',
      description: 'Expert insights on entrepreneurship, management, marketing, and strategies to succeed in the business world.',
      color: 'green'
    },
    {
      icon: Laptop,
      title: 'Technology',
      description: 'Latest tech trends, software reviews, programming tutorials, and innovations shaping our digital future.',
      color: 'purple'
    },
    {
      icon: Gamepad2,
      title: 'Gaming',
      description: 'Game reviews, industry news, tips and tricks, and everything you need to level up your gaming experience.',
      color: 'red'
    },
    {
      icon: Clock,
      title: 'History',
      description: 'Fascinating stories from the past, historical analysis, and lessons that shape our understanding of the world.',
      color: 'orange'
    },
    {
      icon: Briefcase,
      title: 'Jobs & Internships',
      description: 'Career guidance, job opportunities, internship listings, and professional development resources.',
      color: 'teal'
    }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We constantly evolve and adapt to bring you fresh, cutting-edge content that matters.'
    },
    {
      icon: Heart,
      title: 'Integrity',
      description: 'We maintain the highest standards of accuracy, honesty, and ethical journalism in everything we publish.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build meaningful connections and foster a vibrant community of learners and knowledge seekers.'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'We are committed to delivering exceptional quality content that educates, inspires, and transforms.'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', hover: 'group-hover:bg-blue-600' },
      green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', hover: 'group-hover:bg-green-600' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', hover: 'group-hover:bg-purple-600' },
      red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', hover: 'group-hover:bg-red-600' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', hover: 'group-hover:bg-orange-600' },
      teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', hover: 'group-hover:bg-teal-600' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', hover: 'group-hover:bg-yellow-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">About Mayobe Bros</h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Your trusted destination for knowledge, insights, and stories that inspire, educate, and empower minds across the globe
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 max-w-6xl mx-auto">
            {stats.map((stat, index) => {
              const colors = getColorClasses(stat.color);
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 ${colors.bg} rounded-full mb-3 sm:mb-4`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.text}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 ${colors.text}`}>{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Our Story</h2>
            <div className="w-20 sm:w-24 h-1 bg-blue-600 mx-auto mb-6 sm:mb-8"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
            <div className="space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Founded with a vision to democratize knowledge and make quality content accessible to everyone, Mayobe Bros has grown
                from a small blog into a comprehensive media platform serving tens of thousands of readers worldwide.
              </p>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Our journey began with a simple belief: that everyone deserves access to reliable, insightful, and engaging content
                that helps them learn, grow, and succeed in their personal and professional lives.
              </p>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Today, we are proud to be a trusted source for education, technology, business insights, gaming culture, historical
                knowledge, and career opportunities. Our diverse team of writers, editors, and contributors work tirelessly to bring
                you content that matters.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Team collaboration"
                className="rounded-xl shadow-2xl w-full"
              />
            </div>
          </div>

          <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-2xl p-6 sm:p-10 md:p-12 text-center mb-12 sm:mb-20">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Our Mission</h3>
            <p className="text-base sm:text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
              To empower minds worldwide by delivering exceptional content that educates, inspires, and connects people across diverse
              fields of knowledge. We strive to be the platform where curiosity meets credible information, and where learning becomes
              a lifelong journey of discovery and growth.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">What We Offer</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Comprehensive content across six major categories to fuel your curiosity and growth
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {offerings.map((offering, index) => {
                const colors = getColorClasses(offering.color);
                const Icon = offering.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 ${colors.bg} rounded-lg mb-4 sm:mb-5 transition-colors ${colors.hover} group-hover:text-white`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${colors.text} group-hover:text-white transition-colors`} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">{offering.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{offering.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Our Team</h2>
            <div className="w-20 sm:w-24 h-1 bg-blue-600 mx-auto mb-6 sm:mb-8"></div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 sm:p-10 md:p-12">
            <div className="text-center mb-8 sm:mb-10">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet the Mayobe Bros Team</h3>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Our diverse team consists of passionate writers, expert editors, skilled developers, and creative designers who share
                a common goal: to create content that makes a difference.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">15+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Expert Writers</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">8+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Content Editors</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">5+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tech Specialists</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">10+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Contributors</div>
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 text-center mt-6 sm:mt-8">
              We are always looking for talented individuals to join our mission. If you are passionate about creating quality content,
              we would love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Our Core Values</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{value.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share this page</span>
          <SocialShare title="About Mayobe Bros — Your Trusted Knowledge Platform" description="Learn about Mayobe Bros, your trusted destination for education, technology, business insights, gaming, and career opportunities." />
        </div>
      </section>

      <section className="py-12 sm:py-20 container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-2xl p-8 sm:p-12 md:p-16 text-white shadow-2xl">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Join Our Community</h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-blue-100 leading-relaxed">
              Become part of a growing community of learners, thinkers, and achievers. Subscribe to our newsletter for the latest
              articles, exclusive insights, and special content delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
              <button className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 font-semibold text-sm sm:text-base">
                Subscribe Now
              </button>
              <button className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-white/10 transition-all transform hover:scale-105 font-semibold text-sm sm:text-base">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
