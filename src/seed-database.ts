import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const categories = [
  { name: 'Educational', slug: 'educational', description: 'Explore learning resources and educational insights', display_order: 1, show_in_footer: true },
  { name: 'Business Ideas', slug: 'business-ideas', description: 'Discover innovative business opportunities and entrepreneurship tips', display_order: 2, show_in_footer: true },
  { name: 'World Histories', slug: 'world-histories', description: 'Journey through time and discover historical events', display_order: 3, show_in_footer: false },
  { name: 'Video Games Updates', slug: 'video-games-updates', description: 'Latest gaming news, reviews, and updates', display_order: 4, show_in_footer: true },
  { name: 'Technology Solutions', slug: 'technology-solutions', description: 'Tech tips, guides, and cutting-edge solutions', display_order: 5, show_in_footer: true },
  { name: 'Jobs and Internships', slug: 'jobs-and-internships', description: 'Career opportunities and professional development', display_order: 6, show_in_footer: false },
];

const labels = {
  'technology-solutions': [
    { name: 'Smartphones', slug: 'smartphones', description: 'Mobile technology and smartphone guides' },
    { name: 'Software', slug: 'software', description: 'Software reviews and tutorials' },
    { name: 'AI Tools', slug: 'ai-tools', description: 'Artificial Intelligence applications and tools' },
    { name: 'Cyber Security', slug: 'cyber-security', description: 'Security tips and best practices' },
  ],
  'business-ideas': [
    { name: 'Startups', slug: 'startups', description: 'Startup guides and resources' },
    { name: 'E-commerce', slug: 'e-commerce', description: 'Online business strategies' },
    { name: 'Marketing', slug: 'marketing', description: 'Marketing tips and strategies' },
  ],
  'educational': [
    { name: 'Online Learning', slug: 'online-learning', description: 'Digital education resources' },
    { name: 'Study Tips', slug: 'study-tips', description: 'Effective learning strategies' },
    { name: 'Career Development', slug: 'career-development', description: 'Professional growth resources' },
  ],
};

const samplePosts = {
  'technology-solutions': {
    'smartphones': [
      {
        title: 'How to Download and Install Android Apps Safely',
        slug: 'how-to-download-android-app',
        content: `Downloading apps on your Android device is a fundamental skill that every smartphone user should master. In this comprehensive guide, we'll walk you through the safest and most effective methods to download and install apps on your Android device.

The Google Play Store is the official app marketplace for Android devices. It offers millions of apps that have been vetted by Google for security. To download an app, simply open the Play Store, search for the app you want, and tap the Install button. The app will download and install automatically.

However, there are times when you might want to download apps from sources outside the Play Store. This process, known as sideloading, requires you to enable "Install from Unknown Sources" in your device settings. While this gives you more flexibility, it's crucial to only download APK files from trusted sources to avoid malware.

Before installing any app, check the permissions it requests. Be wary of apps that ask for unnecessary permissions, such as a flashlight app requesting access to your contacts. Read user reviews and check the developer's reputation before installing.

Keep your apps updated regularly. Updates often include security patches and bug fixes that protect your device. Enable automatic updates in the Play Store settings to ensure you're always running the latest versions.

Use antivirus software to scan downloaded APK files before installation. This adds an extra layer of protection against malicious software. Popular options include Avast, Bitdefender, and Norton Mobile Security.`,
        excerpt: 'Learn the safest methods to download and install apps on your Android device, including tips for sideloading and security best practices.',
        featured_image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
        is_popular: true,
      },
    ],
    'ai-tools': [
      {
        title: 'Top 10 AI Tools for Productivity in 2024',
        slug: 'top-10-ai-tools-productivity-2024',
        content: `Artificial Intelligence has revolutionized the way we work, offering powerful tools that can automate tasks, enhance creativity, and boost productivity. Here are the top 10 AI tools that are transforming workplaces in 2024.

ChatGPT leads the pack as a versatile AI assistant capable of writing, coding, analysis, and creative tasks. Its natural language understanding makes it accessible to users of all technical levels. Businesses use it for customer service, content creation, and brainstorming sessions.

Midjourney and DALL-E 3 have revolutionized visual content creation. These AI image generators can create stunning artwork, marketing materials, and design concepts from simple text descriptions. Designers and marketers use these tools to rapidly prototype ideas and create unique visuals.

Notion AI integrates seamlessly with the popular productivity platform, offering AI-powered writing assistance, summarization, and organization features. It's perfect for note-taking, project management, and documentation.

Grammarly has evolved beyond grammar checking to offer AI-powered writing suggestions, tone adjustment, and clarity improvements. It's essential for anyone who writes professionally.

Copy.ai specializes in marketing copy generation, creating compelling ad copy, social media posts, and email campaigns. Marketers report significant time savings and improved engagement rates.

Synthesia revolutionizes video creation by generating realistic AI avatars that can present your content in over 120 languages. It's ideal for training videos, marketing content, and presentations.

Jasper focuses on long-form content creation, helping bloggers and content marketers produce SEO-optimized articles at scale. Its templates and brand voice features ensure consistency across all content.

Descript combines transcription, audio editing, and video editing in one AI-powered platform. Simply edit text to edit audio or video, making content creation incredibly intuitive.

Fireflies.ai automates meeting notes and transcription, capturing key points, action items, and decisions from your video calls. It integrates with major video conferencing platforms.

GitHub Copilot assists developers by suggesting code completions and entire functions. It has become an indispensable tool for programmers, significantly speeding up development time.`,
        excerpt: 'Discover the most powerful AI tools that can transform your productivity and streamline your workflow in 2024.',
        featured_image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
        is_popular: true,
      },
    ],
  },
  'business-ideas': {
    'startups': [
      {
        title: 'How to Start a Small Business with Limited Budget',
        slug: 'how-to-start-small-business-limited-budget',
        content: `Starting a business doesn't always require massive capital. With creativity, determination, and smart planning, you can launch a successful venture even with limited funds. Here's your comprehensive guide to bootstrapping your way to success.

First, validate your business idea before spending money. Talk to potential customers, create simple prototypes, and test the market demand. Many entrepreneurs waste resources building products nobody wants. Use free tools like Google Forms for surveys and social media for initial market research.

Start as a service business before creating products. Services require minimal upfront investment and generate immediate cash flow. You can transition to products once you've built a customer base and capital.

Leverage free and low-cost tools for operations. Use free website builders like Wix or WordPress.com, free email marketing tools like Mailchimp's starter plan, and free project management tools like Trello or Asana. Social media platforms offer free marketing channels with enormous reach.

Work from home or use coworking spaces instead of renting expensive offices. Many successful companies started in garages and living rooms. Save on overhead costs until revenue justifies larger expenses.

Bootstrap through customer funding. Offer pre-orders or deposits to finance initial production. Crowdfunding platforms like Kickstarter can validate your idea while raising capital from your future customers.

Partner strategically to access resources you can't afford. Equity partnerships, revenue-sharing agreements, and strategic alliances can provide expertise, networks, and resources without cash expenditure.

Focus on organic growth strategies. Content marketing, SEO, and word-of-mouth are free but require time and effort. Create valuable content that attracts your target audience naturally.

Keep your day job initially. Running your business as a side hustle reduces financial pressure and allows you to grow sustainably. Transition to full-time entrepreneurship once your business generates sufficient income.`,
        excerpt: 'Learn practical strategies to launch your entrepreneurial dreams without breaking the bank.',
        featured_image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
        is_popular: true,
      },
    ],
  },
  'educational': [
    {
      title: 'Effective Study Techniques for Better Learning',
      slug: 'effective-study-techniques',
      content: `Studying effectively is a skill that can be learned and perfected. These evidence-based techniques will help you learn more efficiently and retain information longer.

The Pomodoro Technique breaks study time into focused 25-minute intervals followed by 5-minute breaks. This prevents burnout and maintains concentration. After four pomodoros, take a longer 15-30 minute break. This technique leverages your brain's natural attention span and prevents mental fatigue.

Active recall is more effective than passive reading. Instead of highlighting or rereading, actively try to remember information without looking at your notes. This strengthens memory pathways and identifies gaps in your knowledge.

Spaced repetition optimizes long-term retention. Review material at increasing intervals: after one day, then three days, then a week, then a month. Apps like Anki automate this process for flashcard-based learning.

The Feynman Technique involves explaining concepts in simple terms as if teaching someone else. This reveals gaps in understanding and forces you to think deeply about the material. If you can't explain it simply, you don't understand it well enough.

Practice interleaving by mixing different topics or problem types during study sessions. While it feels harder initially, it improves long-term retention and the ability to apply knowledge flexibly.

Create mind maps to visualize connections between concepts. This engages your brain's spatial memory and helps you see the big picture. Use colors, images, and connections to make your maps memorable.

Test yourself regularly with practice problems and past exam questions. Testing isn't just for assessment; it's one of the most powerful learning tools. Retrieval practice strengthens memory more than any other study method.

Study in different locations to prevent context-dependent memory. Your brain associates information with environmental cues. Varying your study locations makes memories more robust and easier to retrieve in different contexts.

Teach others to solidify your understanding. Join study groups where you explain concepts to peers. Teaching forces you to organize knowledge clearly and identify weak areas.

Prioritize sleep and exercise. Physical health directly impacts cognitive function. Regular exercise improves memory formation, and adequate sleep consolidates learning from the day.`,
      excerpt: 'Master these proven study techniques to improve your learning efficiency and academic performance.',
      featured_image: 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg',
      is_popular: false,
    },
  ],
};

const reviewNames = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'James Smith', 'Aisha Patel',
  'David Kim', 'Maria Garcia', 'Robert Taylor', 'Fatima Ahmed', 'John Williams',
  'Lisa Anderson', 'Ahmed Hassan', 'Jennifer Lee', 'Carlos Martinez', 'Priya Sharma',
  'Daniel Brown', 'Yuki Tanaka', 'Rachel Cohen', 'Omar Ibrahim', 'Sophie Martin',
  'Kevin O\'Brien', 'Nadia Ali', 'Christopher Davis', 'Amara Okafor', 'Matthew Wilson',
  'Zara Khan', 'Anthony Moore', 'Leila Mansour', 'Steven Jackson', 'Mei Ling',
  'Brandon White', 'Aaliyah Johnson', 'Eric Thompson', 'Layla Hassan', 'Jonathan Clark',
  'Samantha Rodriguez', 'Andrew Martinez', 'Yasmin Al-Farsi', 'Nicholas Anderson',
  'Grace Nguyen', 'Timothy Lee', 'Fatima Rahman', 'Alexander Brown', 'Olivia Chen',
  'Benjamin Taylor', 'Isabella Garcia', 'Ryan Kim', 'Sophia Patel', 'Justin Martin',
  'Chloe Williams', 'Marcus Johnson', 'Emma Thompson', 'Lucas Silva', 'Ava Martinez',
  'Ethan Davis', 'Mia Rodriguez', 'Nathan Wilson', 'Charlotte Anderson', 'Dylan Moore',
  'Amelia Lee', 'Isaac Brown', 'Harper Garcia', 'Gabriel Chen', 'Evelyn Kim',
  'Owen Taylor', 'Abigail Patel', 'Henry Martinez', 'Emily Wilson', 'Sebastian Lee',
  'Madison Brown', 'Jack Thompson', 'Elizabeth Garcia', 'Samuel Chen', 'Avery Kim',
  'Joseph Martinez', 'Sofia Rodriguez', 'David Anderson', 'Scarlett Wilson', 'Carter Lee',
  'Aria Brown', 'Wyatt Garcia', 'Luna Chen', 'Luke Kim', 'Zoey Martinez',
  'Levi Rodriguez', 'Penelope Anderson', 'Julian Wilson', 'Layla Lee', 'Jayden Brown',
  'Hannah Garcia', 'Lincoln Chen', 'Nora Kim', 'Grayson Martinez', 'Lily Rodriguez',
  'Leo Anderson', 'Ella Wilson', 'Asher Lee', 'Maya Brown', 'Elijah Garcia',
];

const reviewComments = [
  'Mayobe Bros has become my go-to source for quality content. The articles are well-researched and easy to understand.',
  'I love the variety of topics covered here. From technology to business, there\'s always something interesting to read.',
  'The website design is clean and easy to navigate. I can find exactly what I\'m looking for quickly.',
  'Educational content that actually makes sense! I\'ve learned so much from the technology guides.',
  'Great resource for staying updated on the latest trends. The writers clearly know their stuff.',
  'I appreciate how in-depth the articles are. You can tell a lot of effort goes into each piece.',
  'The business ideas section has inspired me to start my own venture. Thank you for the valuable insights!',
  'As a student, I find the educational resources incredibly helpful for my studies.',
  'The gaming updates are always on point. This is now my primary source for gaming news.',
  'Professional, informative, and engaging content. Mayobe Bros sets the bar high.',
  'I\'ve recommended this site to all my colleagues. The quality is consistently excellent.',
  'The technology solutions have helped me solve so many problems. Practical and easy to follow.',
  'Finally, a website that covers world history in an engaging way. Not boring at all!',
  'The job listings and career advice have been invaluable in my professional journey.',
  'Love how the articles are formatted. Easy to read and visually appealing.',
  'Bookmarked as one of my essential daily reads. Never disappoints!',
  'The writers have a gift for explaining complex topics in simple terms.',
  'Great mix of entertainment and education. I always learn something new.',
  'The mobile experience is just as good as desktop. Well optimized!',
  'Trustworthy content with reliable sources. This is journalism done right.',
];

async function seedDatabase() {
  console.log('Starting database seeding...');

  console.log('Inserting categories...');
  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .insert(categories)
    .select();

  if (catError) {
    console.error('Error inserting categories:', catError);
    return;
  }

  console.log('Inserting labels...');
  const categoryMap = insertedCategories.reduce((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {} as Record<string, string>);

  for (const [categorySlug, categoryLabels] of Object.entries(labels)) {
    const categoryId = categoryMap[categorySlug];
    const labelsWithCategoryId = categoryLabels.map((label, index) => ({
      ...label,
      category_id: categoryId,
      display_order: index,
    }));

    await supabase.from('labels').insert(labelsWithCategoryId);
  }

  console.log('Fetching labels...');
  const { data: insertedLabels } = await supabase.from('labels').select('*');

  console.log('Inserting posts...');
  for (const [categorySlug, categoryPosts] of Object.entries(samplePosts)) {
    const categoryId = categoryMap[categorySlug];

    if (Array.isArray(categoryPosts)) {
      for (const post of categoryPosts) {
        await supabase.from('posts').insert({
          ...post,
          category_id: categoryId,
          label_id: null,
          views: Math.floor(Math.random() * 5000) + 100,
        });
      }
    } else {
      for (const [labelSlug, posts] of Object.entries(categoryPosts)) {
        const label = insertedLabels?.find(
          l => l.slug === labelSlug && l.category_id === categoryId
        );

        for (const post of posts) {
          await supabase.from('posts').insert({
            ...post,
            category_id: categoryId,
            label_id: label?.id || null,
            views: Math.floor(Math.random() * 5000) + 100,
          });
        }
      }
    }
  }

  console.log('Generating 100 reviews...');
  const reviews = [];
  for (let i = 0; i < 100; i++) {
    reviews.push({
      user_name: reviewNames[i % reviewNames.length],
      rating: Math.floor(Math.random() * 2) + 4,
      comment: reviewComments[i % reviewComments.length],
      is_verified: Math.random() > 0.5,
    });
  }

  await supabase.from('reviews').insert(reviews);

  console.log('Database seeding completed successfully!');
}

seedDatabase();
