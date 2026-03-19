import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getSiteSetting } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerNotificationProvider } from "@/contexts/PlayerNotificationContext";

const googleClientId = "386184793784-njlhdvqjh0698tnc5tffi79m5pjqpig4.apps.googleusercontent.com";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SiteThemeApplier } from "@/components/SiteThemeApplier";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PlayerLayout } from "@/components/layout/PlayerLayout";
import { PlayerSiteLayout } from "@/components/layout/PlayerSiteLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import GamesPage from "@/pages/public/GamesPage";
import PopularGamesPage from "@/pages/public/PopularGamesPage";
import TopGamesPage from "@/pages/public/TopGamesPage";
import CategoryListPage from "@/pages/public/CategoryListPage";
import CategoryPage from "@/pages/public/CategoryPage";
import GameDetailPage from "@/pages/public/GameDetailPage";
import ProviderPage from "@/pages/public/ProviderPage";
import ProvidersPage from "@/pages/public/ProvidersPage";
import BonusPage from "@/pages/public/BonusPage";
import PromotionPage from "@/pages/public/PromotionPage";
import WalletPage from "@/pages/public/WalletPage";
import LoginPage from "@/pages/public/LoginPage";
import RegisterPage from "@/pages/public/RegisterPage";
import ForgotPasswordPage from "@/pages/public/ForgotPasswordPage";

// Player Pages
import PlayerDashboard from "@/pages/player/PlayerDashboard";
import PlayerMessages from "@/pages/player/PlayerMessages";
import PlayerWallet from "@/pages/player/PlayerWallet";
import PlayerTransactions from "@/pages/player/PlayerTransactions";
import PlayerGameResults from "@/pages/player/PlayerGameResults";
import PlayerGameLogDetail from "@/pages/player/PlayerGameLogDetail";
import PlayerPaymentModes from "@/pages/player/PlayerPaymentModes";
import PlayerChangePassword from "@/pages/player/PlayerChangePassword";
import PlayerProfile from "@/pages/player/PlayerProfile";
import PlayerReferralPage from "@/pages/player/PlayerReferralPage";
import PlayerReferralDetailPage from "@/pages/player/PlayerReferralDetailPage";

// Admin Pages (shared across roles)
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminPlayers from "@/pages/admin/AdminPlayers";
import AdminMasters from "@/pages/admin/AdminMasters";
import AdminSupers from "@/pages/admin/AdminSupers";
import AdminDeposits from "@/pages/admin/AdminDeposits";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminBonusRequests from "@/pages/admin/AdminBonusRequests";
import AdminGameLog from "@/pages/admin/AdminGameLog";
import AdminGameLogDetail from "@/pages/admin/AdminGameLogDetail";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminActivityLog from "@/pages/admin/AdminActivityLog";
import MasterPaymentModes from "@/pages/admin/MasterPaymentModes";
import AdminPaymentModeVerification from "@/pages/admin/AdminPaymentModeVerification";
import AdminProfile from "@/pages/admin/AdminProfile";
import AdminChangePassword from "@/pages/admin/AdminChangePassword";
import AdminPlayerReport from "@/pages/admin/AdminPlayerReport";
import AdminAccounting from "@/pages/admin/AdminAccounting";
import AdminAccountStatement from "@/pages/admin/AdminAccountStatement";
import AdminBonusStatement from "@/pages/admin/AdminBonusStatement";
import AdminTotalDW from "@/pages/admin/AdminTotalDW";
import AdminSuperMasterDW from "@/pages/admin/AdminSuperMasterDW";
import AdminSuperDWState from "@/pages/admin/AdminSuperDWState";
import AdminPaymentMethod from "@/pages/admin/AdminPaymentMethod";

// Powerhouse-only Pages
import PowerhouseCategories from "@/pages/admin/PowerhouseCategories";
import PowerhouseProviders from "@/pages/admin/PowerhouseProviders";
import PowerhouseGames from "@/pages/admin/PowerhouseGames";
import PowerhouseBonusRules from "@/pages/admin/PowerhouseBonusRules";
import PowerhouseSuperSettings from "@/pages/admin/PowerhouseSuperSettings";
import PowerhouseSiteSettings from "@/pages/admin/PowerhouseSiteSettings";
import PowerhouseSlider from "@/pages/admin/PowerhouseSlider";
import PowerhousePopup from "@/pages/admin/PowerhousePopup";
import PowerhousePromotions from "@/pages/admin/PowerhousePromotions";
import PowerhouseComingSoonEnrollments from "@/pages/admin/PowerhouseComingSoonEnrollments";
import PowerhouseCMS from "@/pages/admin/PowerhouseCMS";
import PowerhouseTestimonials from "@/pages/admin/PowerhouseTestimonials";
import PowerhousePaymentMethods from "@/pages/admin/PowerhousePaymentMethods";
import PowerhouseCountries from "@/pages/admin/PowerhouseCountries";
import PowerhouseSiteHomeCategory from "@/pages/admin/PowerhouseSiteHomeCategory";
import PowerhouseSiteHomeTopGames from "@/pages/admin/PowerhouseSiteHomeTopGames";
import PowerhouseSiteHomeProvider from "@/pages/admin/PowerhouseSiteHomeProvider";
import PowerhouseSiteHomeCategoryGame from "@/pages/admin/PowerhouseSiteHomeCategoryGame";
import PowerhouseSiteHomePopularGame from "@/pages/admin/PowerhouseSiteHomePopularGame";
import PowerhouseComingSoon from "@/pages/admin/PowerhouseComingSoon";
import PowerhouseSiteHomeReferBonus from "@/pages/admin/PowerhouseSiteHomeReferBonus";
import PowerhouseSiteHomePaymentAccepted from "@/pages/admin/PowerhouseSiteHomePaymentAccepted";
import PowerhouseSiteTheme from "@/pages/admin/PowerhouseSiteTheme";

import NotFound from "@/pages/NotFound";
import { GlobalMessageFab } from "@/components/shared/GlobalMessageFab";
import { HOME_PAGE_VARIANT } from "@/config";
import FirstHomePage from "@/pages/public/FirstHomePage";
import SecondHomePage from "@/pages/public/SecondHomePage";
import HomeDesignPage from "@/pages/public/HomeDesignPage";
import { SecondPublicLayout } from "@/components/layout/SecondPublicLayout";
import { HomeDesignLayout } from "@/components/layout/HomeDesignLayout";
import GamePlayPage from "@/pages/public/GamePlayPage";

const queryClient = new QueryClient();

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

const App = () => {
  const content = (
  <HelmetProvider>
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PlayerNotificationProvider>
              <ScrollToTop />
              <SiteFavicon />
              <SiteOgMeta />
              <SiteThemeApplier />
              <GlobalMessageFab />
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
                <Route path="messages" element={<PlayerMessages />} />
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

            {/* Master Dashboard (no dashboard page: redirect to List of User) */}
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

            {/* Super Dashboard (no dashboard page: redirect to List of Master) */}
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
            </Route>

            <Route path="*" element={<NotFound />} />
              </Routes>
            </PlayerNotificationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
  </HelmetProvider>
  );
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
};

export default App;
