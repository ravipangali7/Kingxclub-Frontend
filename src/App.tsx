import { lazy, Suspense, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { getSiteSetting } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerNotificationProvider } from "@/contexts/PlayerNotificationContext";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SiteThemeApplier } from "@/components/SiteThemeApplier";

// Layouts (always needed — keep static)
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PlayerLayout } from "@/components/layout/PlayerLayout";
import { PlayerSiteLayout } from "@/components/layout/PlayerSiteLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SecondPublicLayout } from "@/components/layout/SecondPublicLayout";
import { HomeDesignLayout } from "@/components/layout/HomeDesignLayout";

import { GlobalMessageFab } from "@/components/shared/GlobalMessageFab";
import { HOME_PAGE_VARIANT } from "@/config";
import NotFound from "@/pages/NotFound";

// ── Public Pages ──────────────────────────────────────────────────────────────
const GamesPage = lazy(() => import("@/pages/public/GamesPage"));
const PopularGamesPage = lazy(() => import("@/pages/public/PopularGamesPage"));
const TopGamesPage = lazy(() => import("@/pages/public/TopGamesPage"));
const CategoryListPage = lazy(() => import("@/pages/public/CategoryListPage"));
const CategoryPage = lazy(() => import("@/pages/public/CategoryPage"));
const GameDetailPage = lazy(() => import("@/pages/public/GameDetailPage"));
const ProviderPage = lazy(() => import("@/pages/public/ProviderPage"));
const ProvidersPage = lazy(() => import("@/pages/public/ProvidersPage"));
const BonusPage = lazy(() => import("@/pages/public/BonusPage"));
const PromotionPage = lazy(() => import("@/pages/public/PromotionPage"));
const WalletPage = lazy(() => import("@/pages/public/WalletPage"));
const LoginPage = lazy(() => import("@/pages/public/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/public/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/public/ForgotPasswordPage"));
const GamePlayPage = lazy(() => import("@/pages/public/GamePlayPage"));
const FirstHomePage = lazy(() => import("@/pages/public/FirstHomePage"));
const SecondHomePage = lazy(() => import("@/pages/public/SecondHomePage"));
const HomeDesignPage = lazy(() => import("@/pages/public/HomeDesignPage"));

// ── Player Pages ──────────────────────────────────────────────────────────────
const PlayerDashboard = lazy(() => import("@/pages/player/PlayerDashboard"));
const PlayerWallet = lazy(() => import("@/pages/player/PlayerWallet"));
const PlayerTransactions = lazy(() => import("@/pages/player/PlayerTransactions"));
const PlayerGameResults = lazy(() => import("@/pages/player/PlayerGameResults"));
const PlayerGameLogDetail = lazy(() => import("@/pages/player/PlayerGameLogDetail"));
const PlayerPaymentModes = lazy(() => import("@/pages/player/PlayerPaymentModes"));
const PlayerChangePassword = lazy(() => import("@/pages/player/PlayerChangePassword"));
const PlayerProfile = lazy(() => import("@/pages/player/PlayerProfile"));
const PlayerReferralPage = lazy(() => import("@/pages/player/PlayerReferralPage"));
const PlayerReferralDetailPage = lazy(() => import("@/pages/player/PlayerReferralDetailPage"));

// ── Admin Pages (shared across roles) ────────────────────────────────────────
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminMessages = lazy(() => import("@/pages/admin/AdminMessages"));
const AdminPlayers = lazy(() => import("@/pages/admin/AdminPlayers"));
const AdminMasters = lazy(() => import("@/pages/admin/AdminMasters"));
const AdminSupers = lazy(() => import("@/pages/admin/AdminSupers"));
const AdminDeposits = lazy(() => import("@/pages/admin/AdminDeposits"));
const AdminWithdrawals = lazy(() => import("@/pages/admin/AdminWithdrawals"));
const AdminBonusRequests = lazy(() => import("@/pages/admin/AdminBonusRequests"));
const AdminGameLog = lazy(() => import("@/pages/admin/AdminGameLog"));
const AdminGameLogDetail = lazy(() => import("@/pages/admin/AdminGameLogDetail"));
const AdminTransactions = lazy(() => import("@/pages/admin/AdminTransactions"));
const AdminActivityLog = lazy(() => import("@/pages/admin/AdminActivityLog"));
const MasterPaymentModes = lazy(() => import("@/pages/admin/MasterPaymentModes"));
const AdminPaymentModeVerification = lazy(() => import("@/pages/admin/AdminPaymentModeVerification"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const AdminChangePassword = lazy(() => import("@/pages/admin/AdminChangePassword"));
const AdminPlayerReport = lazy(() => import("@/pages/admin/AdminPlayerReport"));
const AdminAccounting = lazy(() => import("@/pages/admin/AdminAccounting"));
const AdminAccountStatement = lazy(() => import("@/pages/admin/AdminAccountStatement"));
const AdminBonusStatement = lazy(() => import("@/pages/admin/AdminBonusStatement"));
const AdminTotalDW = lazy(() => import("@/pages/admin/AdminTotalDW"));
const AdminSuperMasterDW = lazy(() => import("@/pages/admin/AdminSuperMasterDW"));
const AdminSuperDWState = lazy(() => import("@/pages/admin/AdminSuperDWState"));
const AdminPaymentMethod = lazy(() => import("@/pages/admin/AdminPaymentMethod"));

// ── Powerhouse-only Pages ─────────────────────────────────────────────────────
const PowerhouseCategories = lazy(() => import("@/pages/admin/PowerhouseCategories"));
const PowerhouseProviders = lazy(() => import("@/pages/admin/PowerhouseProviders"));
const PowerhouseGames = lazy(() => import("@/pages/admin/PowerhouseGames"));
const PowerhouseBonusRules = lazy(() => import("@/pages/admin/PowerhouseBonusRules"));
const PowerhouseSuperSettings = lazy(() => import("@/pages/admin/PowerhouseSuperSettings"));
const PowerhouseSiteSettings = lazy(() => import("@/pages/admin/PowerhouseSiteSettings"));
const PowerhouseSlider = lazy(() => import("@/pages/admin/PowerhouseSlider"));
const PowerhousePopup = lazy(() => import("@/pages/admin/PowerhousePopup"));
const PowerhousePromotions = lazy(() => import("@/pages/admin/PowerhousePromotions"));
const PowerhouseComingSoonEnrollments = lazy(() => import("@/pages/admin/PowerhouseComingSoonEnrollments"));
const PowerhouseCMS = lazy(() => import("@/pages/admin/PowerhouseCMS"));
const PowerhouseTestimonials = lazy(() => import("@/pages/admin/PowerhouseTestimonials"));
const PowerhousePaymentMethods = lazy(() => import("@/pages/admin/PowerhousePaymentMethods"));
const PowerhouseCountries = lazy(() => import("@/pages/admin/PowerhouseCountries"));
const PowerhouseSiteHomeCategory = lazy(() => import("@/pages/admin/PowerhouseSiteHomeCategory"));
const PowerhouseSiteHomeTopGames = lazy(() => import("@/pages/admin/PowerhouseSiteHomeTopGames"));
const PowerhouseSiteHomeProvider = lazy(() => import("@/pages/admin/PowerhouseSiteHomeProvider"));
const PowerhouseSiteHomeCategoryGame = lazy(() => import("@/pages/admin/PowerhouseSiteHomeCategoryGame"));
const PowerhouseSiteHomePopularGame = lazy(() => import("@/pages/admin/PowerhouseSiteHomePopularGame"));
const PowerhouseComingSoon = lazy(() => import("@/pages/admin/PowerhouseComingSoon"));
const PowerhouseSiteHomeReferBonus = lazy(() => import("@/pages/admin/PowerhouseSiteHomeReferBonus"));
const PowerhouseSiteHomePaymentAccepted = lazy(() => import("@/pages/admin/PowerhouseSiteHomePaymentAccepted"));
const PowerhouseSiteTheme = lazy(() => import("@/pages/admin/PowerhouseSiteTheme"));
const PowerhouseCleanData = lazy(() => import("@/pages/admin/PowerhouseCleanData"));
const PowerhouseAnalytics = lazy(() => import("@/pages/admin/PowerhouseAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteFavicon() {
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  useEffect(() => {
    const favicon = (siteSetting as { favicon?: string } | undefined)?.favicon;
    const href = favicon?.trim() ? getMediaUrl(favicon.trim()) : "/karnali-logo.png";
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [siteSetting]);
  return null;
}

function SiteOgMeta() {
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const s = siteSetting as { name?: string; logo?: string; hero_title?: string } | undefined;
  const ogTitle = (s?.name || "KarnaliX").trim();
  const ogImage = s?.logo?.trim() ? getMediaUrl(s.logo.trim()) : null;
  const ogDescription = (s?.hero_title || ogTitle).trim();
  const ogUrl = typeof window !== "undefined" ? window.location.origin + "/" : "";
  return (
    <Helmet>
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:url" content={ogUrl} />
      {ogDescription ? <meta property="og:description" content={ogDescription} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}

function HomePageSwitch() {
  if (HOME_PAGE_VARIANT === "second") {
    return (
      <SecondPublicLayout>
        <SecondHomePage />
      </SecondPublicLayout>
    );
  }
  return (
    <HomeDesignLayout>
      <HomeDesignPage />
    </HomeDesignLayout>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AppShell() {
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const googleAuthEnabled = Boolean((siteSetting as { google_auth_enabled?: boolean } | undefined)?.google_auth_enabled);
  const googleClientId = ((siteSetting as { google_client_id?: string } | undefined)?.google_client_id ?? "").trim();
  const content = (
    <BrowserRouter>
      <PlayerNotificationProvider>
        <ScrollToTop />
        <SiteFavicon />
        <SiteOgMeta />
        <SiteThemeApplier />
        <GlobalMessageFab />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<HomePageSwitch />} />
            <Route element={<PublicLayout />}>
              <Route path="/games" element={<GamesPage />} />
              <Route path="/games/popular" element={<PopularGamesPage />} />
              <Route path="/games/top" element={<TopGamesPage />} />
              <Route path="/categories" element={<CategoryListPage />} />
              <Route path="/categories/:categoryId" element={<CategoryPage />} />
              <Route path="/games/:id" element={<GameDetailPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/providers/:id" element={<ProviderPage />} />
              <Route path="/bonus" element={<BonusPage />} />
              <Route path="/promotions" element={<PromotionPage />} />
              <Route path="/wallet" element={<WalletPage />} />
            </Route>

            {/* In-app game play (full-screen iframe + back button only), player only */}
            <Route path="/games/:id/play" element={<ProtectedRoute allowedRole="player"><GamePlayPage /></ProtectedRoute>} />

            {/* Auth (no layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Player Dashboard (inside site header/footer) */}
            <Route element={<ProtectedRoute allowedRole="player"><PlayerSiteLayout /></ProtectedRoute>}>
              <Route path="/player" element={<PlayerLayout />}>
                <Route index element={<PlayerDashboard />} />
                <Route path="wallet" element={<PlayerWallet />} />
                <Route path="transactions" element={<PlayerTransactions />} />
                <Route path="game-results" element={<PlayerGameResults />} />
                <Route path="game-results/:id" element={<PlayerGameLogDetail />} />
                <Route path="payment-modes" element={<PlayerPaymentModes />} />
                <Route path="change-password" element={<PlayerChangePassword />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="referral" element={<PlayerReferralPage />} />
                <Route path="referral/:id" element={<PlayerReferralDetailPage />} />
              </Route>
            </Route>

            {/* Master Dashboard */}
            <Route element={<ProtectedRoute allowedRole="master"><AdminLayout role="master" /></ProtectedRoute>}>
              <Route path="/master" element={<Navigate to="/master/players" replace />} />
              <Route path="/master/players" element={<AdminPlayers />} />
              <Route path="/master/players/:id/report" element={<AdminPlayerReport />} />
              <Route path="/master/account-statement" element={<AdminAccountStatement />} />
              <Route path="/master/bonus-statement" element={<AdminBonusStatement />} />
              <Route path="/master/deposits" element={<AdminDeposits />} />
              <Route path="/master/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/master/bonus-requests" element={<AdminBonusRequests />} />
              <Route path="/master/client-request/total-dw" element={<AdminTotalDW />} />
              <Route path="/master/payment-modes" element={<MasterPaymentModes />} />
              <Route path="/master/payment-mode-verification" element={<AdminPaymentModeVerification />} />
              <Route path="/master/activity" element={<AdminActivityLog />} />
              <Route path="/master/messages" element={<AdminMessages role="master" />} />
              <Route path="/master/profile" element={<AdminProfile />} />
              <Route path="/master/change-password" element={<AdminChangePassword />} />
            </Route>

            {/* Super Dashboard */}
            <Route element={<ProtectedRoute allowedRole="super"><AdminLayout role="super" /></ProtectedRoute>}>
              <Route path="/super" element={<Navigate to="/super/masters" replace />} />
              <Route path="/super/masters" element={<AdminMasters />} />
              <Route path="/super/players" element={<AdminPlayers />} />
              <Route path="/super/players/:id/report" element={<AdminPlayerReport />} />
              <Route path="/super/account-statement" element={<AdminAccountStatement />} />
              <Route path="/super/bonus-statement" element={<AdminBonusStatement />} />
              <Route path="/super/deposits" element={<AdminDeposits />} />
              <Route path="/super/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/super/bonus-requests" element={<AdminBonusRequests />} />
              <Route path="/super/client-request/total-dw" element={<AdminTotalDW />} />
              <Route path="/super/client-request/super-master-dw" element={<AdminSuperMasterDW />} />
              <Route path="/super/client-request/super-dw-state" element={<AdminSuperDWState />} />
              <Route path="/super/payment-method" element={<Navigate to="/super/payment-mode-verification" replace />} />
              <Route path="/super/payment-mode-verification" element={<AdminPaymentModeVerification />} />
              <Route path="/super/activity" element={<AdminActivityLog />} />
              <Route path="/super/messages" element={<AdminMessages role="super" />} />
              <Route path="/super/profile" element={<AdminProfile />} />
              <Route path="/super/change-password" element={<AdminChangePassword />} />
            </Route>

            {/* Powerhouse Dashboard */}
            <Route element={<ProtectedRoute allowedRole="powerhouse"><AdminLayout role="powerhouse" /></ProtectedRoute>}>
              <Route path="/powerhouse" element={<Navigate to="/powerhouse/dashboard" replace />} />
              <Route path="/powerhouse/dashboard" element={<AdminDashboard role="powerhouse" />} />
              <Route path="/powerhouse/messages" element={<AdminMessages role="powerhouse" />} />
              <Route path="/powerhouse/supers" element={<AdminSupers />} />
              <Route path="/powerhouse/masters" element={<AdminMasters />} />
              <Route path="/powerhouse/players" element={<AdminPlayers />} />
              <Route path="/powerhouse/players/:id/report" element={<AdminPlayerReport />} />
              <Route path="/powerhouse/payment-mode-verification" element={<AdminPaymentModeVerification />} />
              <Route path="/powerhouse/account-statement" element={<AdminAccountStatement />} />
              <Route path="/powerhouse/bonus-statement" element={<AdminBonusStatement />} />
              <Route path="/powerhouse/deposits" element={<AdminDeposits />} />
              <Route path="/powerhouse/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/powerhouse/bonus-requests" element={<AdminBonusRequests />} />
              <Route path="/powerhouse/client-request/total-dw" element={<AdminTotalDW />} />
              <Route path="/powerhouse/client-request/super-master-dw" element={<AdminSuperMasterDW />} />
              <Route path="/powerhouse/client-request/super-dw-state" element={<AdminSuperDWState />} />
              <Route path="/powerhouse/categories" element={<PowerhouseCategories />} />
              <Route path="/powerhouse/providers" element={<PowerhouseProviders />} />
              <Route path="/powerhouse/games" element={<PowerhouseGames />} />
              <Route path="/powerhouse/slider" element={<PowerhouseSlider />} />
              <Route path="/powerhouse/popup" element={<PowerhousePopup />} />
              <Route path="/powerhouse/promotions" element={<PowerhousePromotions />} />
              <Route path="/powerhouse/coming-soon-enrollments" element={<PowerhouseComingSoonEnrollments />} />
              <Route path="/powerhouse/bonus-rules" element={<PowerhouseBonusRules />} />
              <Route path="/powerhouse/game-log" element={<AdminGameLog />} />
              <Route path="/powerhouse/game-log/:id" element={<AdminGameLogDetail />} />
              <Route path="/powerhouse/transactions" element={<AdminTransactions />} />
              <Route path="/powerhouse/accounting" element={<AdminAccounting />} />
              <Route path="/powerhouse/activity" element={<AdminActivityLog />} />
              <Route path="/powerhouse/analytics" element={<PowerhouseAnalytics />} />
              <Route path="/powerhouse/super-settings" element={<PowerhouseSuperSettings />} />
              <Route path="/powerhouse/site-settings" element={<PowerhouseSiteSettings />} />
              <Route path="/powerhouse/site-home-category" element={<PowerhouseSiteHomeCategory />} />
              <Route path="/powerhouse/site-home-top-games" element={<PowerhouseSiteHomeTopGames />} />
              <Route path="/powerhouse/site-home-provider" element={<PowerhouseSiteHomeProvider />} />
              <Route path="/powerhouse/site-home-category-game" element={<PowerhouseSiteHomeCategoryGame />} />
              <Route path="/powerhouse/site-home-popular-game" element={<PowerhouseSiteHomePopularGame />} />
              <Route path="/powerhouse/coming-soon" element={<PowerhouseComingSoon />} />
              <Route path="/powerhouse/site-home-refer-bonus" element={<PowerhouseSiteHomeReferBonus />} />
              <Route path="/powerhouse/site-home-payment-accepted" element={<PowerhouseSiteHomePaymentAccepted />} />
              <Route path="/powerhouse/site-theme" element={<PowerhouseSiteTheme />} />
              <Route path="/powerhouse/cms" element={<PowerhouseCMS />} />
              <Route path="/powerhouse/testimonials" element={<PowerhouseTestimonials />} />
              <Route path="/powerhouse/payment-methods" element={<PowerhousePaymentMethods />} />
              <Route path="/powerhouse/countries" element={<PowerhouseCountries />} />
              <Route path="/powerhouse/profile" element={<AdminProfile />} />
              <Route path="/powerhouse/change-password" element={<AdminChangePassword />} />
              <Route path="/powerhouse/clean-data" element={<PowerhouseCleanData />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PlayerNotificationProvider>
    </BrowserRouter>
  );
  return googleAuthEnabled && googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppShell />
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
