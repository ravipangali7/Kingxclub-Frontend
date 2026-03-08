// ============ GAME CATEGORIES ============
export const gameCategories = [
  { id: "1", name: "Cricket", icon: "🏏", active: true },
  { id: "2", name: "Football", icon: "⚽", active: true },
  { id: "3", name: "Tennis", icon: "🎾", active: true },
  { id: "4", name: "Casino", icon: "🎰", active: true },
  { id: "5", name: "Card Games", icon: "🃏", active: true },
  { id: "6", name: "Slots", icon: "🎲", active: true },
  { id: "7", name: "Live Casino", icon: "🎬", active: true },
  { id: "8", name: "Horse Racing", icon: "🐎", active: true },
];

// ============ GAME PROVIDERS ============
export const gameProviders = [
  { id: "1", name: "Evolution Gaming", code: "EVO", active: true },
  { id: "2", name: "Pragmatic Play", code: "PP", active: true },
  { id: "3", name: "Microgaming", code: "MG", active: true },
  { id: "4", name: "NetEnt", code: "NE", active: true },
  { id: "5", name: "Betsoft", code: "BS", active: true },
];

// ============ GAMES ============
export const games = Array.from({ length: 60 }, (_, i) => ({
  id: `game-${i + 1}`,
  name: [
    "Dragon Tiger", "Andar Bahar", "Teen Patti", "Roulette Pro", "Blackjack VIP",
    "Lucky 7", "Mega Slots", "Poker King", "Baccarat Gold", "Crash Aviator",
    "Cricket Star", "Football Fever", "Tennis Ace", "Horse Sprint", "Dice Roll",
    "Jackpot City", "Wild West", "Ocean Treasure", "Fire Joker", "Book of Dead",
  ][i % 20],
  category: gameCategories[i % gameCategories.length],
  provider: gameProviders[i % gameProviders.length],
  image: `https://picsum.photos/seed/game${i + 1}/400/300`,
  minBet: [10, 50, 100][i % 3],
  maxBet: [5000, 10000, 50000][i % 3],
  active: true,
  plays: Math.floor(Math.random() * 10000) + 500,
}));

// ============ USERS ============
export const players = Array.from({ length: 20 }, (_, i) => ({
  id: `player-${i + 1}`,
  username: `player${i + 1}`,
  fullName: ["Ram Sharma", "Sita Devi", "Hari Bahadur", "Gita Kumari", "Bikash Thapa", "Anita Rai", "Sunil KC", "Puja Bhandari", "Rajan Adhikari", "Maya Gurung"][i % 10],
  balance: Math.floor(Math.random() * 50000) + 1000,
  bonusBalance: Math.floor(Math.random() * 5000),
  exposure: Math.floor(Math.random() * 10000),
  status: (["active", "active", "active", "suspended", "active"] as const)[i % 5],
  phone: `+977-98${Math.floor(10000000 + Math.random() * 90000000)}`,
  parentMaster: `master-${(i % 5) + 1}`,
  joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  kycStatus: (["approved", "pending", "rejected", "approved", "pending"] as const)[i % 5],
}));

export const masters = Array.from({ length: 8 }, (_, i) => ({
  id: `master-${i + 1}`,
  username: `master${i + 1}`,
  fullName: ["Deepak Bista", "Kamala Shrestha", "Mohan Patel", "Sunita Dangol", "Rajesh Maharjan", "Laxmi Tamang", "Prabin Pokharel", "Sabina Magar"][i],
  balance: Math.floor(Math.random() * 200000) + 50000,
  profitLoss: Math.floor(Math.random() * 40000) - 10000,
  playersCount: Math.floor(Math.random() * 20) + 5,
  usersBalance: Math.floor(Math.random() * 100000),
  status: (["active", "active", "suspended", "active"] as const)[i % 4],
  parentSuper: `super-${(i % 3) + 1}`,
  joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  pin: `${1000 + i}`,
}));

export const supers = Array.from({ length: 4 }, (_, i) => ({
  id: `super-${i + 1}`,
  username: `super${i + 1}`,
  fullName: ["Binod Chaudhary", "Sarita Lamichhane", "Keshav Sthapit", "Nirmala Acharya"][i],
  balance: Math.floor(Math.random() * 500000) + 100000,
  profitLoss: Math.floor(Math.random() * 100000) - 20000,
  mastersCount: Math.floor(Math.random() * 5) + 2,
  playersCount: Math.floor(Math.random() * 40) + 10,
  usersBalance: Math.floor(Math.random() * 300000),
  status: "active" as const,
  parentPowerhouse: "powerhouse-1",
  joinedDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
  pin: `${2000 + i}`,
}));

// ============ TRANSACTIONS ============
export const deposits = Array.from({ length: 30 }, (_, i) => ({
  id: `dep-${i + 1}`,
  userId: players[i % players.length].id,
  username: players[i % players.length].username,
  amount: [500, 1000, 2000, 5000, 10000][i % 5],
  status: (["approved", "pending", "rejected", "approved", "pending"] as const)[i % 5],
  paymentMode: ["eSewa", "Khalti", "Bank Transfer", "IME Pay"][i % 4],
  screenshot: `https://picsum.photos/seed/dep${i}/200/300`,
  createdAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1).toISOString(),
  processedBy: i % 2 === 0 ? masters[0].username : undefined,
}));

export const withdrawals = Array.from({ length: 20 }, (_, i) => ({
  id: `wd-${i + 1}`,
  userId: players[i % players.length].id,
  username: players[i % players.length].username,
  amount: [1000, 2000, 5000, 10000, 20000][i % 5],
  status: (["approved", "pending", "rejected", "approved"] as const)[i % 4],
  paymentMode: ["eSewa", "Khalti", "Bank Transfer"][i % 3],
  accountDetails: `****${1000 + i}`,
  createdAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1).toISOString(),
  processedBy: i % 3 === 0 ? masters[0].username : undefined,
}));

// ============ TRANSACTIONS HISTORY ============
export const transactions = Array.from({ length: 50 }, (_, i) => ({
  id: `txn-${i + 1}`,
  userId: players[i % players.length].id,
  username: players[i % players.length].username,
  type: (["deposit", "withdrawal", "bet", "win", "bonus", "transfer"] as const)[i % 6],
  amount: Math.floor(Math.random() * 10000) + 100,
  balanceBefore: Math.floor(Math.random() * 50000),
  balanceAfter: Math.floor(Math.random() * 50000),
  description: ["Deposit via eSewa", "Withdrawal to Bank", "Bet on Cricket Star", "Win from Roulette", "Welcome Bonus", "Transfer from Master"][i % 6],
  createdAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
}));

// ============ GAME LOG ============
export const gameLogs = Array.from({ length: 40 }, (_, i) => ({
  id: `gl-${i + 1}`,
  userId: players[i % players.length].id,
  username: players[i % players.length].username,
  game: games[i % games.length].name,
  category: games[i % games.length].category.name,
  betAmount: [100, 200, 500, 1000, 2000][i % 5],
  result: (["win", "loss", "win", "loss", "draw"] as const)[i % 5],
  winAmount: i % 5 === 0 || i % 5 === 2 ? Math.floor(Math.random() * 5000) + 100 : 0,
  playedAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
}));

// ============ KYC REQUESTS ============
export const kycRequests = Array.from({ length: 10 }, (_, i) => ({
  id: `kyc-${i + 1}`,
  userId: players[i % players.length].id,
  username: players[i % players.length].username,
  documentType: ["Citizenship", "Passport", "Driving License"][i % 3],
  documentImage: `https://picsum.photos/seed/kyc${i}/400/300`,
  status: (["pending", "approved", "rejected", "pending", "approved"] as const)[i % 5],
  submittedAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1).toISOString(),
  reviewedBy: i % 5 === 1 || i % 5 === 4 ? masters[0].username : undefined,
}));

// ============ PAYMENT MODES ============
export const paymentModes = [
  { id: "pm-1", type: "ewallet" as const, name: "eSewa", accountId: "9841234567", active: true },
  { id: "pm-2", type: "ewallet" as const, name: "Khalti", accountId: "9851234567", active: true },
  { id: "pm-3", type: "bank" as const, name: "NIC Asia Bank", accountNumber: "****5678", branch: "Kathmandu", active: true },
  { id: "pm-4", type: "ewallet" as const, name: "IME Pay", accountId: "9861234567", active: true },
];

// ============ BONUS RULES ============
export const bonusRules = [
  { id: "br-1", name: "Welcome Bonus", type: "first_deposit", promoCode: "WELCOME100", rewardType: "percentage", rewardAmount: 100, maxReward: 5000, rollRequired: 5, validFrom: "2025-01-01", validTo: "2025-12-31", active: true },
  { id: "br-2", name: "Refer & Earn", type: "referral", promoCode: "REFER500", rewardType: "fixed", rewardAmount: 500, maxReward: 500, rollRequired: 3, validFrom: "2025-01-01", validTo: "2025-12-31", active: true },
  { id: "br-3", name: "Weekend Bonus", type: "deposit", promoCode: "WEEKEND50", rewardType: "percentage", rewardAmount: 50, maxReward: 2500, rollRequired: 4, validFrom: "2025-01-01", validTo: "2025-12-31", active: true },
];

// ============ MESSAGES ============
export const messages = [
  { id: "msg-1", from: "player1", to: "master1", message: "I need to deposit 5000", timestamp: "2025-02-10T10:30:00Z", read: true },
  { id: "msg-2", from: "master1", to: "player1", message: "Please use eSewa for deposit", timestamp: "2025-02-10T10:32:00Z", read: true },
  { id: "msg-3", from: "player1", to: "master1", message: "Done, please check", timestamp: "2025-02-10T10:35:00Z", read: false },
  { id: "msg-4", from: "master1", to: "player1", message: "Deposit approved! Balance updated.", timestamp: "2025-02-10T10:40:00Z", read: false },
  { id: "msg-5", from: "player2", to: "master1", message: "How to withdraw?", timestamp: "2025-02-10T11:00:00Z", read: false },
];

// ============ ACTIVITY LOG ============
export const activityLogs = Array.from({ length: 30 }, (_, i) => ({
  id: `act-${i + 1}`,
  userId: [...players, ...masters, ...supers][i % (players.length + masters.length + supers.length)].id,
  username: [...players, ...masters, ...supers][i % (players.length + masters.length + supers.length)].username,
  action: ["login", "logout", "deposit_approved", "withdrawal_rejected", "password_changed", "kyc_submitted", "game_played", "user_created"][i % 8],
  details: ["Logged in from mobile", "Session ended", "Approved deposit #123", "Rejected withdrawal #456", "Password updated", "KYC document uploaded", "Played Dragon Tiger", "Created new player"][i % 8],
  ipAddress: `192.168.${i % 255}.${(i * 3) % 255}`,
  createdAt: new Date(2025, 1, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
}));

// ============ TESTIMONIALS ============
export const testimonials = [
  { id: "t-1", name: "Ram K.", rating: 5, review: "Best gaming platform in Nepal! Fast deposits and great games.", avatar: "https://i.pravatar.cc/100?img=1", active: true },
  { id: "t-2", name: "Sita D.", rating: 4, review: "Amazing experience with the live casino games. Highly recommended!", avatar: "https://i.pravatar.cc/100?img=2", active: true },
  { id: "t-3", name: "Hari B.", rating: 5, review: "Quick withdrawals and excellent customer support. Love it!", avatar: "https://i.pravatar.cc/100?img=3", active: true },
  { id: "t-4", name: "Gita P.", rating: 4, review: "Great variety of games and generous bonuses.", avatar: "https://i.pravatar.cc/100?img=4", active: true },
];

// ============ SITE SETTINGS ============
export const siteSettings = {
  siteName: "Karnali X",
  logo: "/karnali-logo.png",
  phone1: "+977-9800000001",
  phone2: "+977-9800000002",
  email: "support@karnalix.com",
  whatsapp: "+977-9800000001",
  heroTitle: "Play. Win. Dominate.",
  heroSubtitle: "Nepal's Premier Online Gaming Platform",
  footerText: "© 2025 Karnali X. All rights reserved.",
};

// ============ CMS PAGES ============
export const cmsPages = [
  { id: "cms-1", title: "About Us", slug: "about-us", content: "Karnali X is Nepal's leading online gaming platform...", showInHeader: false, showInFooter: true, active: true },
  { id: "cms-2", title: "Terms & Conditions", slug: "terms", content: "By using Karnali X, you agree to...", showInHeader: false, showInFooter: true, active: true },
  { id: "cms-3", title: "Privacy Policy", slug: "privacy", content: "We value your privacy...", showInHeader: false, showInFooter: true, active: true },
  { id: "cms-4", title: "Responsible Gaming", slug: "responsible-gaming", content: "We promote responsible gaming...", showInHeader: false, showInFooter: true, active: true },
];

// ============ SUPER SETTINGS ============
export const superSettings = {
  ggr: 15,
  depositMin: 100,
  depositMax: 100000,
  withdrawMin: 500,
  withdrawMax: 50000,
  maxExposure: 200000,
  apiEndpoint: "https://api.karnalix.com/v1",
  apiKey: "kx_live_xxxxx",
};
