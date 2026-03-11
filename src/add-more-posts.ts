import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const additionalPosts = [
  {
    category: 'video-games-updates',
    label: null,
    title: 'Top Gaming Releases to Watch in 2024',
    slug: 'top-gaming-releases-2024',
    content: `2024 is shaping up to be an incredible year for gaming with blockbuster releases across all platforms. Here's your guide to the most anticipated games that will define the year.

Final Fantasy VII Rebirth continues Cloud's journey in this highly anticipated sequel. Square Enix is promising an expanded world with deeper RPG mechanics and stunning visuals that push the PlayStation 5 to its limits.

Senua's Saga: Hellblade II brings Ninja Theory's psychologically intense action adventure to Xbox Series X. The sequel promises improved combat, breathtaking Icelandic landscapes, and an even more powerful narrative about mental health.

Dragon's Dogma 2 returns after a decade with Capcom's ambitious open-world RPG. The game features revolutionary AI companions, dynamic weather systems that affect gameplay, and combat that builds on the beloved original.

Starfield's first major expansion continues Bethesda's space epic with new planets, storylines, and gameplay mechanics based on player feedback from the base game.

The Legend of Zelda: Tears of the Kingdom DLC expands the already massive adventure with new areas to explore, additional story content, and innovative new abilities for Link.

Resident Evil 9 rumored for late 2024, promises to return to the series' survival horror roots while incorporating lessons learned from the successful remakes and Village.

Indie darlings like Hollow Knight: Silksong and Hades II continue to generate excitement, proving that smaller studios can compete with AAA blockbusters through creativity and passion.`,
    excerpt: 'Discover the most exciting games launching this year across all platforms.',
    featured_image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg',
    is_popular: true,
  },
  {
    category: 'world-histories',
    label: null,
    title: 'The Rise and Fall of Ancient Rome: A Comprehensive Overview',
    slug: 'rise-fall-ancient-rome',
    content: `Ancient Rome stands as one of history's most influential civilizations, shaping Western culture, law, language, and government for millennia. Understanding Rome's journey from a small settlement to a vast empire provides crucial insights into human organization and ambition.

Rome's legendary founding in 753 BCE by Romulus began as a settlement of shepherds on the Palatine Hill. Archaeological evidence suggests Etruscan influence shaped early Roman culture, government, and religion.

The Roman Republic (509-27 BCE) established governmental structures that influenced modern democracy. The Senate, consuls, and assemblies created checks and balances that prevented absolute power, though patrician families dominated politics.

Rome's military prowess expanded its territory across the Mediterranean through the Punic Wars against Carthage. Hannibal's invasion of Italy tested Roman resilience, ultimately strengthening their determination and tactical abilities.

Julius Caesar's crossing of the Rubicon in 49 BCE marked the Republic's death throes. His assassination in 44 BCE led to civil war, culminating in his adopted son Octavian becoming Augustus, the first Emperor.

The Pax Romana (27 BCE - 180 CE) brought unprecedented peace and prosperity. Roman engineering created aqueducts, roads, and buildings that still stand today. Latin evolved into Romance languages, while Roman law formed the basis for modern legal systems.

Christianity's spread through the Empire transformed Western religion. Constantine's conversion and the Edict of Milan legalized Christianity, eventually making it Rome's official religion.

The Empire's division into Eastern and Western halves reflected administrative challenges and external pressures. Germanic invasions, economic troubles, and political instability weakened the Western Empire.

Rome's fall in 476 CE didn't end its influence. The Byzantine Empire preserved Roman traditions for another millennium. The Renaissance rediscovered Roman art and literature, while Enlightenment thinkers drew inspiration from Republican ideals.`,
    excerpt: 'Explore the fascinating history of Ancient Rome from its legendary founding to its lasting legacy.',
    featured_image: 'https://images.pexels.com/photos/2701569/pexels-photo-2701569.jpeg',
    is_popular: false,
  },
  {
    category: 'jobs-and-internships',
    label: null,
    title: 'How to Land Your First Tech Internship',
    slug: 'land-first-tech-internship',
    content: `Breaking into the tech industry through an internship opens doors to incredible career opportunities. This comprehensive guide will help you navigate the competitive landscape and secure your first tech internship.

Start early by building your skills through online courses. Platforms like Coursera, edX, and freeCodeCamp offer free resources in programming, data science, and design. Focus on technologies that interest you and align with your career goals.

Create a portfolio showcasing your projects. Build real applications, contribute to open-source projects, or complete coding challenges. Employers value practical experience over theoretical knowledge. Host your projects on GitHub with clear documentation.

Craft a compelling resume that highlights technical skills and projects. Use action verbs and quantify achievements where possible. Keep it concise, well-formatted, and free of errors. Tailor your resume for each application, emphasizing relevant skills.

Network strategically both online and offline. Attend tech meetups, join LinkedIn groups, and participate in hackathons. Many internships come through referrals, so building relationships is crucial.

Apply widely but thoughtfully. Research companies that align with your values and interests. Don't limit yourself to big tech companies; startups and mid-sized companies often offer better learning opportunities.

Prepare thoroughly for technical interviews. Practice coding problems on LeetCode, HackerRank, and CodeSignal. Review computer science fundamentals including data structures, algorithms, and system design basics.

Develop your soft skills alongside technical abilities. Communication, teamwork, and problem-solving matter as much as coding proficiency. Be ready to discuss projects conversationally and explain your thought process.

Follow up after interviews with thank-you emails expressing genuine interest. Be patient but persistent; the hiring process can take weeks or months.`,
    excerpt: 'Your step-by-step guide to securing a competitive tech internship and launching your career.',
    featured_image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
    is_popular: true,
  },
];

async function addMorePosts() {
  console.log('Fetching categories...');
  const { data: categories } = await supabase.from('categories').select('*');

  if (!categories) {
    console.error('No categories found');
    return;
  }

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {} as Record<string, string>);

  console.log('Adding more posts...');

  for (const post of additionalPosts) {
    const categoryId = categoryMap[post.category];

    if (!categoryId) {
      console.error(`Category not found: ${post.category}`);
      continue;
    }

    await supabase.from('posts').insert({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category_id: categoryId,
      label_id: post.label,
      featured_image: post.featured_image,
      is_popular: post.is_popular,
      views: Math.floor(Math.random() * 5000) + 100,
    });
  }

  console.log('Additional posts added successfully!');
}

addMorePosts();
