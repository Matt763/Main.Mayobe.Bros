export type Animal = {
  id: string;
  slug: string;
  name: string;
  scientificName: string;
  category: string;
  status: "Least Concern" | "Near Threatened" | "Vulnerable" | "Endangered" | "Critically Endangered";
  description: string;
  longDescription: string;
  habitat: string;
  diet: string;
  lifespan: string;
  weight: string;
  region: string;
  image: string;
  heroImage: string;
  gallery: string[];
  labels: string[];
  featured: boolean;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  category: string;
  labels: string[];
  image: string;
  publishedAt: string;
  readTime: number;
  featured: boolean;
  status: "published" | "draft";
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  count: number;
};

export type Label = {
  id: string;
  slug: string;
  name: string;
  color: string;
  count: number;
  heroImage?: string;
};

export type SiteSettings = {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  accentColor: string;
  theme: "light" | "dark" | "system";
  showPumba: boolean;
  footerText: string;
};

export const categories: Category[] = [
  {
    id: "1",
    slug: "mammals",
    name: "Mammals",
    description: "The great warm-blooded creatures that roam our planet",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
    count: 12,
  },
  {
    id: "2",
    slug: "birds",
    name: "Birds",
    description: "Magnificent winged inhabitants of sky and forest",
    image: "https://images.unsplash.com/photo-1611759386153-4fce5f29e7fa?w=800&q=80",
    count: 8,
  },
  {
    id: "3",
    slug: "reptiles",
    name: "Reptiles",
    description: "Ancient cold-blooded masters of land and water",
    image: "https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800&q=80",
    count: 6,
  },
  {
    id: "4",
    slug: "marine-life",
    name: "Marine Life",
    description: "The mysterious and beautiful creatures of the deep",
    image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80",
    count: 9,
  },
  {
    id: "5",
    slug: "primates",
    name: "Primates",
    description: "Our closest relatives in the animal kingdom",
    image: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=800&q=80",
    count: 5,
  },
  {
    id: "6",
    slug: "big-cats",
    name: "Big Cats",
    description: "The apex predators that define raw power and elegance",
    image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80",
    count: 7,
  },
];

export const labels: Label[] = [
  { id: "1", slug: "endangered", name: "Endangered", color: "#ef4444", count: 8 },
  { id: "2", slug: "conservation", name: "Conservation", color: "#22c55e", count: 15 },
  { id: "3", slug: "africa", name: "Africa", color: "#f59e0b", count: 11 },
  { id: "4", slug: "asia", name: "Asia", color: "#3b82f6", count: 9 },
  { id: "5", slug: "ocean", name: "Ocean", color: "#06b6d4", count: 7 },
  { id: "6", slug: "rainforest", name: "Rainforest", color: "#10b981", count: 6 },
  { id: "7", slug: "nocturnal", name: "Nocturnal", color: "#8b5cf6", count: 4 },
  { id: "8", slug: "apex-predator", name: "Apex Predator", color: "#ec4899", count: 5 },
  { id: "9", slug: "migratory", name: "Migratory", color: "#f97316", count: 8 },
  { id: "10", slug: "social", name: "Social", color: "#14b8a6", count: 10 },
];

export const animals: Animal[] = [
  {
    id: "1",
    slug: "african-lion",
    name: "African Lion",
    scientificName: "Panthera leo",
    category: "big-cats",
    status: "Vulnerable",
    description: "The king of the savanna — a symbol of raw power, pride, and ancient grace.",
    longDescription: "The African lion is one of the most iconic and powerful predators on Earth. Known as the 'King of the Jungle,' lions actually prefer open savannas and grasslands. They are highly social animals, living in groups called prides that consist of related females and their cubs, along with a small number of adult males. Lions are the only truly social cats, which gives them a significant advantage in hunting and raising young. Males are known for their impressive manes, which signal health and genetic fitness to females. With populations declining due to habitat loss and human conflict, conservation efforts are critical to their survival.",
    habitat: "African savanna and grasslands",
    diet: "Carnivore — wildebeest, zebra, buffalo",
    lifespan: "10–14 years in the wild",
    weight: "120–250 kg",
    region: "Sub-Saharan Africa",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1600&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80",
    ],
    labels: ["africa", "apex-predator", "social"],
    featured: true,
  },
  {
    id: "2",
    slug: "african-elephant",
    name: "African Elephant",
    scientificName: "Loxodonta africana",
    category: "mammals",
    status: "Vulnerable",
    description: "The gentle giant — Earth's largest land animal, guardian of the ecosystem.",
    longDescription: "African elephants are the world's largest land animals, revered across cultures for their intelligence, emotional depth, and ecological importance. They are keystone species, shaping entire landscapes through their movement and feeding habits. Elephants are highly intelligent and display complex social behavior, including mourning their dead, using tools, and communicating over vast distances using infrasound. Matriarchs lead herds with decades of accumulated knowledge. Tragically, poaching for ivory and habitat destruction have severely reduced their numbers, making conservation efforts more urgent than ever.",
    habitat: "Savannas, forests, and deserts",
    diet: "Herbivore — grasses, leaves, bark, fruit",
    lifespan: "60–70 years in the wild",
    weight: "4,000–7,000 kg",
    region: "Sub-Saharan Africa",
    image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=1600&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
    ],
    labels: ["africa", "endangered", "conservation", "social"],
    featured: true,
  },
  {
    id: "3",
    slug: "cheetah",
    name: "Cheetah",
    scientificName: "Acinonyx jubatus",
    category: "big-cats",
    status: "Vulnerable",
    description: "Speed incarnate — the fastest land animal, a blur of gold across the savanna.",
    longDescription: "The cheetah is the fastest land animal on Earth, capable of reaching speeds of up to 70–75 mph in short bursts. Unlike other big cats, cheetahs hunt during the day using their exceptional eyesight to spot prey from a great distance. Their slender, aerodynamic build, semi-retractable claws for grip, and enlarged heart and lungs make them perfectly adapted for high-speed pursuit. Cheetahs are also unique among big cats in that they purr rather than roar. With fewer than 7,000 individuals remaining in the wild, cheetahs face severe threats from habitat loss, decline of prey, and human conflict.",
    habitat: "Open grasslands and savannas",
    diet: "Carnivore — gazelles, impalas, hares",
    lifespan: "10–12 years in the wild",
    weight: "21–72 kg",
    region: "Africa and parts of Iran",
    image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=1600&q=90",
    gallery: [],
    labels: ["africa", "endangered", "apex-predator"],
    featured: true,
  },
  {
    id: "4",
    slug: "mountain-gorilla",
    name: "Mountain Gorilla",
    scientificName: "Gorilla beringei beringei",
    category: "primates",
    status: "Endangered",
    description: "Gentle giants of the mist — our closest kin, hidden in ancient volcanic forests.",
    longDescription: "Mountain gorillas are one of the most endangered great apes on the planet, found only in the dense forests of the Virunga Mountains and Uganda's Bwindi Impenetrable Forest. Despite their imposing size, gorillas are peaceful herbivores with complex social structures led by a dominant silverback male. They share approximately 98% of their DNA with humans, showing remarkable intelligence, tool use, and emotional range. Conservation success stories like those in Rwanda give hope — their population has slowly grown from around 620 in 2003 to over 1,000 today, thanks to dedicated anti-poaching efforts and eco-tourism programs.",
    habitat: "High-altitude tropical rainforests",
    diet: "Herbivore — leaves, shoots, fruit, bark",
    lifespan: "35–40 years in the wild",
    weight: "100–200 kg",
    region: "Central Africa",
    image: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1600&q=90",
    gallery: [],
    labels: ["africa", "endangered", "rainforest", "social"],
    featured: true,
  },
  {
    id: "5",
    slug: "humpback-whale",
    name: "Humpback Whale",
    scientificName: "Megaptera novaeangliae",
    category: "marine-life",
    status: "Least Concern",
    description: "Ocean poets — their haunting songs travel thousands of miles through the deep.",
    longDescription: "Humpback whales are among the most studied and beloved marine mammals on Earth. Known for their spectacular acrobatic breaches and complex, hauntingly beautiful songs, they are a symbol of ocean life. Humpback whales undertake some of the longest migrations of any mammal, traveling up to 16,000 miles round trip between feeding and breeding grounds. Once hunted nearly to extinction by commercial whaling, their recovery since the 1966 international moratorium has been one of conservation's greatest success stories. Males produce elaborate songs during breeding season that can evolve and spread across ocean basins.",
    habitat: "All major oceans",
    diet: "Krill, small fish",
    lifespan: "45–100 years",
    weight: "25,000–40,000 kg",
    region: "Worldwide oceans",
    image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=1600&q=90",
    gallery: [],
    labels: ["ocean", "conservation", "migratory"],
    featured: true,
  },
  {
    id: "6",
    slug: "snow-leopard",
    name: "Snow Leopard",
    scientificName: "Panthera uncia",
    category: "big-cats",
    status: "Vulnerable",
    description: "Ghost of the mountains — elusive, ethereal, perfectly adapted to the high peaks.",
    longDescription: "The snow leopard is one of the world's most elusive and beautiful big cats, adapted perfectly for life in the cold, rugged mountains of Central and South Asia. Their thick, smoky-grey fur with dark rosettes provides perfect camouflage among rocky terrain and snow. Snow leopards have large paws that act like natural snowshoes and long, thick tails that help with balance on rocky slopes — and serve as a built-in scarf in cold weather. Unlike other big cats, snow leopards cannot roar — they communicate through chuffing, hissing, and mewing. With perhaps 4,000–6,500 remaining in the wild, they are at serious risk from poaching and climate change.",
    habitat: "Alpine and subalpine zones of Central Asia",
    diet: "Carnivore — blue sheep, ibex, deer",
    lifespan: "10–12 years in the wild",
    weight: "25–55 kg",
    region: "Central and South Asia",
    image: "https://images.unsplash.com/photo-1605695002688-3a42e9c8cf9c?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1605695002688-3a42e9c8cf9c?w=1600&q=90",
    gallery: [],
    labels: ["asia", "endangered", "apex-predator"],
    featured: false,
  },
  {
    id: "7",
    slug: "bald-eagle",
    name: "Bald Eagle",
    scientificName: "Haliaeetus leucocephalus",
    category: "birds",
    status: "Least Concern",
    description: "Sovereign of the skies — a symbol of freedom, power, and natural majesty.",
    longDescription: "The bald eagle is North America's iconic apex avian predator and a symbol of strength and freedom. With a wingspan stretching up to 8 feet, they are formidable hunters that dive at speeds of up to 75 mph to catch fish from the water's surface. Bald eagles mate for life and build the largest nests of any North American bird — some nests grow to over 4 meters deep after years of use. After being brought to the brink of extinction by DDT poisoning in the mid-20th century, the bald eagle made a remarkable comeback following conservation efforts and the ban of DDT in 1972.",
    habitat: "Near large bodies of open water",
    diet: "Fish, small mammals, waterfowl",
    lifespan: "20–30 years in the wild",
    weight: "3–6.3 kg",
    region: "North America",
    image: "https://images.unsplash.com/photo-1611759386153-4fce5f29e7fa?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1611759386153-4fce5f29e7fa?w=1600&q=90",
    gallery: [],
    labels: ["apex-predator", "conservation"],
    featured: false,
  },
  {
    id: "8",
    slug: "amur-tiger",
    name: "Amur Tiger",
    scientificName: "Panthera tigris altaica",
    category: "big-cats",
    status: "Endangered",
    description: "Monarch of the taiga — the largest wild cat on Earth, fierce and breathtakingly rare.",
    longDescription: "The Amur tiger, also known as the Siberian tiger, is the largest subspecies of tiger and the largest wild cat in the world. Males can reach lengths of up to 3.3 meters and weigh as much as 300 kg. Unlike their tropical cousins, Amur tigers have adapted to survive brutal Siberian winters, developing thicker fur and a layer of fat to insulate against the cold. Once numbering in the thousands, rampant poaching and habitat destruction reduced their population to as few as 40 individuals in the 1940s. Intensive conservation efforts in Russia have helped their numbers recover to around 500 today — a fragile but inspiring success.",
    habitat: "Boreal forests and mountains of the Russian Far East",
    diet: "Carnivore — deer, wild boar, bear",
    lifespan: "10–15 years in the wild",
    weight: "180–300 kg",
    region: "Russian Far East",
    image: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?w=1600&q=90",
    gallery: [],
    labels: ["asia", "endangered", "apex-predator"],
    featured: true,
  },
];

export const posts: Post[] = [
  {
    id: "1",
    slug: "lion-pride-dynamics",
    title: "The Complex Social Dynamics of Lion Prides",
    excerpt: "Discover the intricate social structures that make lion prides one of nature's most fascinating communities.",
    content: "Lions are the only truly social cats in the world...",
    author: "Dr. Sarah Kimani",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    category: "big-cats",
    labels: ["africa", "social", "apex-predator"],
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
    publishedAt: "2025-12-10",
    readTime: 7,
    featured: true,
    status: "published",
  },
  {
    id: "2",
    slug: "elephant-memory-intelligence",
    title: "Never Forget: The Extraordinary Intelligence of Elephants",
    excerpt: "How elephants remember migration routes, recognize hundreds of individuals, and mourn their dead.",
    content: "Elephants have long been celebrated for their remarkable memories...",
    author: "Prof. James Okoye",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    category: "mammals",
    labels: ["africa", "conservation", "social"],
    image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
    publishedAt: "2025-12-05",
    readTime: 9,
    featured: true,
    status: "published",
  },
  {
    id: "3",
    slug: "cheetah-speed-science",
    title: "Breaking the Speed Limit: The Science Behind Cheetah Velocity",
    excerpt: "A deep dive into the biomechanics, evolution, and adaptations that make the cheetah Earth's fastest land animal.",
    content: "At 70 miles per hour, the cheetah achieves something no other land animal can...",
    author: "Dr. Maya Patel",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    category: "big-cats",
    labels: ["africa", "apex-predator"],
    image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80",
    publishedAt: "2025-11-28",
    readTime: 6,
    featured: false,
    status: "published",
  },
  {
    id: "4",
    slug: "gorilla-conservation-success",
    title: "Back from the Brink: Rwanda's Mountain Gorilla Success Story",
    excerpt: "How community-based conservation and eco-tourism turned the tide for one of our closest relatives.",
    content: "In 2003, fewer than 620 mountain gorillas remained on Earth...",
    author: "Dr. Sarah Kimani",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    category: "primates",
    labels: ["africa", "endangered", "conservation", "rainforest"],
    image: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=800&q=80",
    publishedAt: "2025-11-20",
    readTime: 10,
    featured: true,
    status: "published",
  },
  {
    id: "5",
    slug: "whale-songs-mysteries",
    title: "Ocean Voices: The Mysterious Songs of Humpback Whales",
    excerpt: "Scientists are decoding the complex, evolving songs that humpback whales sing across entire ocean basins.",
    content: "Beneath the ocean surface, a symphony plays out...",
    author: "Dr. Elena Vasquez",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    category: "marine-life",
    labels: ["ocean", "conservation", "migratory"],
    image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80",
    publishedAt: "2025-11-15",
    readTime: 8,
    featured: false,
    status: "published",
  },
  {
    id: "6",
    slug: "snow-leopard-ghost-mountains",
    title: "The Ghost of the Mountains: Tracking Snow Leopards in the Himalayas",
    excerpt: "Researchers use camera traps and satellite collars to unravel the mysteries of one of Earth's most elusive cats.",
    content: "For centuries, the snow leopard existed more as legend than living creature...",
    author: "Prof. Zhang Wei",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    category: "big-cats",
    labels: ["asia", "endangered", "apex-predator"],
    image: "https://images.unsplash.com/photo-1605695002688-3a42e9c8cf9c?w=800&q=80",
    publishedAt: "2025-11-05",
    readTime: 11,
    featured: false,
    status: "published",
  },
];

export const siteSettings: SiteSettings = {
  siteName: "Wild Sanctuary",
  siteTagline: "Where Nature Speaks",
  siteDescription: "Explore the world's most magnificent wildlife — their stories, habitats, and the fight to protect them.",
  heroTitle: "Where the Wild Things Reign",
  heroSubtitle: "Explore the untamed beauty of Earth's most extraordinary creatures and the ancient kingdoms they call home.",
  accentColor: "#CA8A04",
  theme: "system",
  showPumba: true,
  footerText: "Dedicated to the protection and celebration of wildlife worldwide.",
};

export const stats = [
  { label: "Species Documented", value: "1,200+", icon: "paw" },
  { label: "Conservation Stories", value: "340+", icon: "leaf" },
  { label: "Countries Covered", value: "87", icon: "globe" },
  { label: "Active Researchers", value: "520+", icon: "users" },
];
