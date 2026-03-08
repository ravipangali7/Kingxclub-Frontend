/**
 * Mock data for the home page design (HOME_PAGE_DESIGN.md).
 * No API calls — all data from this file.
 */

export interface HeroData {
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface GameCardShape {
  id: string;
  name: string;
  image: string;
  category: string;
  players: number;
  minBet: number;
  maxBet: number;
  rating: number;
  isHot?: boolean;
  isNew?: boolean;
  provider?: string;
}

export interface PromoShape {
  variant?: "welcome" | "deposit" | "referral" | "tournament" | "cashback";
  badge?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  description?: string;
  cta?: string;
  href?: string;
}

export interface CategoryShape {
  slug: string;
  label?: string;
  count?: number;
  /** Category id from API; when set, View All links to /games?category=id */
  id?: number;
}

export interface ProviderShape {
  id?: number;
  name: string;
  /** Letter(s) for fallback when no image (e.g. first 2 chars of name). */
  logo: string;
  /** Optional image URL for provider logo; when set, show img instead of letter logo. */
  logoImage?: string;
  games: number;
  color: string;
  /** When set, link to this game (detail) instead of provider page. */
  single_game_id?: number | null;
  /** When set (e.g. from backend), use this exact path for redirect. */
  link?: string;
}

export interface ComingSoonShape {
  id?: string;
  name: string;
  image: string;
  launchDate?: string;
  description?: string;
}

export interface TestimonialShape {
  id?: number;
  name: string;
  avatar?: string;
  location?: string;
  game?: string;
  amount?: string;
  message: string;
  rating?: number;
}

export interface RecentWinShape {
  user: string;
  game: string;
  amount: string;
  time: string;
}

export const hero: HeroData = {
  badge: "Nepal's #1 Gaming Platform",
  title: "Play. Win. Repeat.",
  subtitle: "Experience the thrill of 500+ games with live dealers, instant payouts, and unbeatable odds. Join thousands of winners today!",
  ctaText: "Start Playing",
  ctaHref: "/register",
};

export const featuredGames: GameCardShape[] = [
  { id: "f1", name: "Aviator", image: "https://picsum.photos/seed/av1/640/360", category: "CRASH", players: 12500, minBet: 10, maxBet: 50000, rating: 4.9, isHot: true, provider: "Spribe" },
  { id: "f2", name: "Crazy Time", image: "https://picsum.photos/seed/ct1/640/360", category: "LIVE CASINO", players: 8200, minBet: 20, maxBet: 100000, rating: 4.8, isNew: true, provider: "Evolution" },
  { id: "f3", name: "Sweet Bonanza", image: "https://picsum.photos/seed/sb1/640/360", category: "CASINO", players: 18900, minBet: 5, maxBet: 25000, rating: 4.7, isHot: true, provider: "Pragmatic" },
  { id: "f4", name: "Dragon Tiger", image: "https://picsum.photos/seed/dt1/640/360", category: "LIVE CASINO", players: 5600, minBet: 10, maxBet: 50000, rating: 4.6, provider: "Evolution" },
  { id: "f5", name: "Spaceman", image: "https://picsum.photos/seed/sp1/640/360", category: "CRASH", players: 9100, minBet: 5, maxBet: 20000, rating: 4.8, isNew: true, provider: "Pragmatic" },
];

export const promosGrid: PromoShape[] = [
  { variant: "welcome", badge: "🎁 LIMITED OFFER", title: "Welcome Bonus", highlight: "200%", subtitle: "Up to ₹50,000", description: "Double your first deposit and start winning big!", cta: "Claim Now", href: "/bonus" },
  { variant: "referral", badge: "👥 REFER & EARN", title: "Invite Friends", highlight: "₹500", subtitle: "Per Referral", description: "Share your link and earn for every friend who joins!", cta: "Get Your Link", href: "/player/referral" },
];

export const tournamentPromo: PromoShape = {
  variant: "tournament",
  badge: "🏆 WEEKLY EVENT",
  title: "Mega Tournament",
  highlight: "₹10 Lakh",
  subtitle: "Prize Pool",
  description: "Compete with the best and win massive rewards!",
  cta: "Join Now",
  href: "/promotions",
};

export const cashbackPromo: PromoShape = {
  variant: "cashback",
  badge: "💰 EVERY WEEK",
  title: "Cashback Offer",
  highlight: "15%",
  subtitle: "Weekly Cashback",
  description: "Get money back on your losses every week!",
  cta: "Learn More",
  href: "/promotions",
};

export const categories: CategoryShape[] = [
  { slug: "crash", label: "Crash Games", count: 12 },
  { slug: "casino", label: "Casino Games", count: 85 },
  { slug: "liveCasino", label: "Live Casino", count: 42 },
  { slug: "sports", label: "Sports Betting", count: 28 },
  { slug: "casual", label: "Casual Games", count: 35 },
];

const gameImage = (seed: string) => `https://picsum.photos/seed/${seed}/400/300`;

export const gamesByCategory: Record<string, GameCardShape[]> = {
  crash: [
    { id: "c1", name: "Aviator", image: gameImage("c1"), category: "CRASH", players: 12500, minBet: 10, maxBet: 50000, rating: 4.9, isHot: true, provider: "Spribe" },
    { id: "c2", name: "Spaceman", image: gameImage("c2"), category: "CRASH", players: 9100, minBet: 5, maxBet: 20000, rating: 4.8, isNew: true, provider: "Pragmatic" },
    { id: "c3", name: "JetX", image: gameImage("c3"), category: "CRASH", players: 7200, minBet: 5, maxBet: 10000, rating: 4.7, provider: "Smartsoft" },
    { id: "c4", name: "Crash X", image: gameImage("c4"), category: "CRASH", players: 5400, minBet: 10, maxBet: 25000, rating: 4.6, provider: "Spribe" },
    { id: "c5", name: "Mines", image: gameImage("c5"), category: "CRASH", players: 6800, minBet: 1, maxBet: 50000, rating: 4.5, isHot: true, provider: "BGaming" },
  ],
  casino: [
    { id: "v1", name: "Sweet Bonanza", image: gameImage("v1"), category: "CASINO", players: 18900, minBet: 5, maxBet: 25000, rating: 4.7, isHot: true, provider: "Pragmatic" },
    { id: "v2", name: "Gates of Olympus", image: gameImage("v2"), category: "CASINO", players: 15200, minBet: 10, maxBet: 50000, rating: 4.8, provider: "Pragmatic" },
    { id: "v3", name: "Book of Dead", image: gameImage("v3"), category: "CASINO", players: 11200, minBet: 5, maxBet: 10000, rating: 4.6, provider: "Play'n GO" },
    { id: "v4", name: "Starburst", image: gameImage("v4"), category: "CASINO", players: 9800, minBet: 1, maxBet: 5000, rating: 4.5, provider: "NetEnt" },
    { id: "v5", name: "Big Bass Bonanza", image: gameImage("v5"), category: "CASINO", players: 14500, minBet: 10, maxBet: 20000, rating: 4.7, isNew: true, provider: "Pragmatic" },
    { id: "v6", name: "Wolf Gold", image: gameImage("v6"), category: "CASINO", players: 7600, minBet: 5, maxBet: 15000, rating: 4.4, provider: "Pragmatic" },
  ],
  liveCasino: [
    { id: "l1", name: "Crazy Time", image: gameImage("l1"), category: "LIVE CASINO", players: 8200, minBet: 20, maxBet: 100000, rating: 4.8, isNew: true, provider: "Evolution" },
    { id: "l2", name: "Dragon Tiger", image: gameImage("l2"), category: "LIVE CASINO", players: 5600, minBet: 10, maxBet: 50000, rating: 4.6, provider: "Evolution" },
    { id: "l3", name: "Lightning Roulette", image: gameImage("l3"), category: "LIVE CASINO", players: 6700, minBet: 10, maxBet: 25000, rating: 4.7, provider: "Evolution" },
    { id: "l4", name: "Monopoly Live", image: gameImage("l4"), category: "LIVE CASINO", players: 4900, minBet: 10, maxBet: 20000, rating: 4.5, provider: "Evolution" },
    { id: "l5", name: "Baccarat Squeeze", image: gameImage("l5"), category: "LIVE CASINO", players: 3800, minBet: 50, maxBet: 100000, rating: 4.6, provider: "Evolution" },
  ],
  sports: [
    { id: "s1", name: "Cricket Betting", image: gameImage("s1"), category: "SPORTS", players: 22000, minBet: 10, maxBet: 100000, rating: 4.8, isHot: true, provider: "In-house" },
    { id: "s2", name: "Football Match Odds", image: gameImage("s2"), category: "SPORTS", players: 18500, minBet: 20, maxBet: 50000, rating: 4.7, provider: "In-house" },
    { id: "s3", name: "Tennis Outright", image: gameImage("s3"), category: "SPORTS", players: 6200, minBet: 10, maxBet: 25000, rating: 4.5, provider: "In-house" },
    { id: "s4", name: "Kabaddi League", image: gameImage("s4"), category: "SPORTS", players: 9400, minBet: 10, maxBet: 30000, rating: 4.6, isNew: true, provider: "In-house" },
    { id: "s5", name: "Horse Racing", image: gameImage("s5"), category: "SPORTS", players: 4100, minBet: 50, maxBet: 50000, rating: 4.4, provider: "In-house" },
  ],
  casual: [
    { id: "z1", name: "Teen Patti", image: gameImage("z1"), category: "CASUAL", players: 15600, minBet: 5, maxBet: 20000, rating: 4.7, isHot: true, provider: "In-house" },
    { id: "z2", name: "Andar Bahar", image: gameImage("z2"), category: "CASUAL", players: 13200, minBet: 10, maxBet: 50000, rating: 4.6, provider: "In-house" },
    { id: "z3", name: "Rummy", image: gameImage("z3"), category: "CASUAL", players: 9800, minBet: 5, maxBet: 10000, rating: 4.5, provider: "In-house" },
    { id: "z4", name: "Ludo", image: gameImage("z4"), category: "CASUAL", players: 11200, minBet: 1, maxBet: 5000, rating: 4.6, isNew: true, provider: "In-house" },
    { id: "z5", name: "Carrom", image: gameImage("z5"), category: "CASUAL", players: 5400, minBet: 5, maxBet: 10000, rating: 4.4, provider: "In-house" },
  ],
};

export const providers: ProviderShape[] = [
  { name: "Evolution", logo: "EV", games: 120, color: "from-orange-500 to-red-500" },
  { name: "Pragmatic Play", logo: "PP", games: 85, color: "from-amber-500 to-orange-500" },
  { name: "Spribe", logo: "SP", games: 15, color: "from-cyan-500 to-blue-500" },
  { name: "NetEnt", logo: "NE", games: 95, color: "from-green-500 to-emerald-600" },
  { name: "Play'n GO", logo: "PG", games: 70, color: "from-violet-500 to-purple-600" },
  { name: "Microgaming", logo: "MG", games: 200, color: "from-pink-500 to-rose-500" },
  { name: "BGaming", logo: "BG", games: 45, color: "from-yellow-500 to-amber-500" },
  { name: "Smartsoft", logo: "SS", games: 12, color: "from-teal-500 to-cyan-500" },
];

export const comingSoon: ComingSoonShape[] = [
  { id: "cs1", name: "Mega Roulette", image: gameImage("cs1"), launchDate: "Coming Feb 2025", description: "Multiplier roulette with huge payouts." },
  { id: "cs2", name: "JetX 2", image: gameImage("cs2"), launchDate: "Coming Mar 2025", description: "Next-gen crash experience." },
  { id: "cs3", name: "Deal or No Deal Live", image: gameImage("cs3"), launchDate: "Coming Apr 2025", description: "Live game show from Evolution." },
  { id: "cs4", name: "Buffalo King Megaways", image: gameImage("cs4"), launchDate: "Coming May 2025", description: "Megaways slot with free spins." },
  { id: "cs5", name: "Football Studio", image: gameImage("cs5"), launchDate: "Coming Jun 2025", description: "Live football-themed card game." },
];

export const testimonials: TestimonialShape[] = [
  { id: 1, name: "Raj K.", avatar: "RK", location: "Kathmandu", game: "Aviator", amount: "₹2,50,000", message: "Best platform in Nepal. Withdrawals are instant and support is always helpful. Love the crash games!", rating: 5 },
  { id: 2, name: "Sita M.", avatar: "SM", location: "Pokhara", game: "Crazy Time", amount: "₹1,80,000", message: "Amazing live casino experience. Fair play and great bonuses. Recommended to all my friends.", rating: 5 },
  { id: 3, name: "Hari P.", avatar: "HP", location: "Lalitpur", game: "Sweet Bonanza", amount: "₹95,000", message: "Quick KYC and smooth deposits. Games load fast even on mobile. 5 stars!", rating: 4 },
  { id: 4, name: "Gita S.", avatar: "GS", location: "Biratnagar", game: "Dragon Tiger", amount: "₹3,20,000", message: "Won big here. Customer care resolved my query in minutes. Will keep playing.", rating: 5 },
];

export const recentWins: RecentWinShape[] = [
  { user: "Ra***sh", game: "Aviator", amount: "₹45,200", time: "1 min ago" },
  { user: "Si***a", game: "Crazy Time", amount: "₹1,25,000", time: "2 min ago" },
  { user: "Ha***i", game: "Sweet Bonanza", amount: "₹28,900", time: "3 min ago" },
  { user: "Gi***a", game: "Dragon Tiger", amount: "₹67,500", time: "5 min ago" },
  { user: "Bi***h", game: "Spaceman", amount: "₹12,400", time: "7 min ago" },
  { user: "An***a", game: "Lightning Roulette", amount: "₹89,000", time: "9 min ago" },
];

export const heroStats = [
  { label: "Active Players", value: "50K+", icon: "users" },
  { label: "Games", value: "500+", icon: "gamepad" },
  { label: "Total Winnings", value: "₹10Cr+", icon: "trophy" },
  { label: "Instant Payouts", value: "24/7", icon: "zap" },
];

export const liveOddsTicker = [
  { home: "India", away: "Pakistan", odds1: "1.85", odds2: "2.02", live: true },
  { home: "Mumbai Indians", away: "CSK", odds1: "1.92", odds2: "1.90", live: false },
  { home: "Man United", away: "Liverpool", odds1: "2.40", odds2: "2.85", live: true },
  { home: "Nepal", away: "Netherlands", odds1: "3.20", odds2: "1.35", live: false },
  { home: "Real Madrid", away: "Barcelona", odds1: "2.10", odds2: "3.25", live: true },
];

export const footerContact = {
  phone: "+977-9800000001",
  email: "support@karnalix.com",
  whatsapp: "+9779800000001",
  tagline: "Nepal's Premier Online Gaming Platform. Play responsibly.",
};

export const footerLinks = {
  games: [
    { label: "Crash Games", href: "/games/crash" },
    { label: "Casino", href: "/games/casino" },
    { label: "Live Casino", href: "/games/liveCasino" },
    { label: "Sports", href: "/sports" },
    { label: "Promotions", href: "/promotions" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "WhatsApp Support", href: "#" },
  ],
  legal: [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Responsible Gaming", href: "/responsible-gaming" },
  ],
  about: [
    { label: "About Us", href: "/about" },
    { label: "Affiliate", href: "/affiliate" },
    { label: "Careers", href: "/careers" },
  ],
};

export const paymentMethods = ["eSewa", "Khalti", "UPI", "Bank Transfer"];
