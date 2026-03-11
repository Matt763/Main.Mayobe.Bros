import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

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

async function seedReviews() {
  console.log('Seeding 100 reviews...');

  const reviews = [];
  for (let i = 0; i < 100; i++) {
    reviews.push({
      user_name: reviewNames[i % reviewNames.length],
      rating: Math.floor(Math.random() * 2) + 4,
      comment: reviewComments[i % reviewComments.length],
      is_verified: Math.random() > 0.5,
    });
  }

  const { error } = await supabase.from('reviews').insert(reviews);

  if (error) {
    console.error('Error inserting reviews:', error);
    return;
  }

  console.log('Reviews seeded successfully!');
}

seedReviews();
