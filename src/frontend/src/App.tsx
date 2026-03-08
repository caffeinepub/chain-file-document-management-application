import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // When user logs in successfully, navigate to dashboard and show welcome
  useEffect(() => {
    if (
      loginStatus === "success" &&
      isAuthenticated &&
      userProfile &&
      !hasShownWelcome
    ) {
      setShowDashboard(true);
      toast.success(`Welcome back, ${userProfile.name}!`, {
        description: "You have successfully logged in.",
      });
      setHasShownWelcome(true);
    }
  }, [loginStatus, isAuthenticated, userProfile, hasShownWelcome]);

  // Reset welcome flag when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      setShowDashboard(false);
      setHasShownWelcome(false);
    }
  }, [isAuthenticated, isInitializing]);

  const handleNavigateHome = () => {
    setShowDashboard(false);
  };

  const handleNavigateToDashboard = () => {
    setShowDashboard(true);
  };

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground font-medium">
              Initializing Chain File...
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          onNavigateHome={handleNavigateHome}
          onNavigateToDashboard={handleNavigateToDashboard}
          showHomeButton={isAuthenticated && showDashboard}
        />
        <main className="flex-1">
          {isAuthenticated ? (
            showDashboard ? (
              <Dashboard />
            ) : (
              <LandingPage onNavigateToDashboard={handleNavigateToDashboard} />
            )
          ) : (
            <LandingPage />
          )}
        </main>
        <Footer />
        <Toaster />
        {showProfileSetup && <ProfileSetupModal />}
      </div>
    </ThemeProvider>
  );
}
