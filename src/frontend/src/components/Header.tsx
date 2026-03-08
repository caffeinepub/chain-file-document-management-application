import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Home, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

interface HeaderProps {
  onNavigateHome?: () => void;
  onNavigateToDashboard?: () => void;
  showHomeButton?: boolean;
}

export default function Header({
  onNavigateHome,
  onNavigateToDashboard,
  showHomeButton,
}: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const disabled = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      try {
        await clear();
        queryClient.clear();
        toast.success("Logged out successfully");
      } catch (error: any) {
        console.error("Logout error:", error);
        toast.error("Failed to logout. Please try again.");
      }
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);

        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error("Failed to login. Please try again.");
        }
      }
    }
  };

  const handleDashboardClick = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container flex h-24 md:h-28 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <img
              src="/assets/uploads/grok_image_xcsys9y-1.jpg"
              alt="Chain File"
              className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 drop-shadow-2xl animate-float rounded-xl object-cover"
            />
            <div className="absolute inset-0 blur-2xl bg-primary/30 -z-10 rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight gradient-text-primary">
              Chain File
            </h1>
            <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
              Secure Document Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {showHomeButton && onNavigateHome && (
            <Button
              variant="ghost"
              onClick={onNavigateHome}
              className="gap-2 glass hover:neon-glow-primary transition-all duration-300"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Home</span>
            </Button>
          )}

          {isAuthenticated && userProfile && !profileLoading ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 glass neon-glow-primary hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-strong">
                <DropdownMenuLabel className="font-display font-bold">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDashboardClick}
                  className="gap-2 font-semibold cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleAuth}
                  className="gap-2 text-destructive focus:text-destructive font-semibold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAuthenticated && profileLoading ? (
            <Button
              variant="outline"
              disabled
              className="gap-2 glass font-semibold"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="hidden sm:inline">Loading...</span>
            </Button>
          ) : (
            <Button
              onClick={handleAuth}
              disabled={disabled}
              className="gap-2 neon-glow-primary hover:scale-105 transition-all duration-300 font-bold elevation-2"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {loginStatus === "logging-in" ? "Connecting..." : "Login"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
