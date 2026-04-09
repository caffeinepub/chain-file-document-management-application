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
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
} from "lucide-react";
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
      } catch (error: unknown) {
        console.error("Logout error:", error);
        toast.error("Failed to logout. Please try again.");
      }
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Login error:", err);
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error("Failed to login. Please try again.");
        }
      }
    }
  };

  const handleDashboardClick = () => {
    if (onNavigateToDashboard) onNavigateToDashboard();
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-subtle"
      data-ocid="header-nav"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo + brand */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-3 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          aria-label="Chain File home"
        >
          <img
            src="/assets/uploads/grok_image_xcsys9y-1.jpg"
            alt="Chain File"
            className="h-9 w-9 rounded-lg object-cover shadow-elevated"
          />
          <div className="leading-none">
            <span className="block text-lg font-display font-bold text-foreground tracking-tight">
              Chain File
            </span>
            <span className="block text-xs text-muted-foreground font-body">
              Secure Document Storage
            </span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2" data-ocid="header-actions">
          {showHomeButton && onNavigateHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateHome}
              className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav-home-btn"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Home</span>
            </Button>
          )}

          {isAuthenticated && userProfile && !profileLoading ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border bg-card hover:bg-muted transition-colors font-medium"
                  data-ocid="user-menu-trigger"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 border border-accent/25">
                    <User className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {userProfile.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-card border-border shadow-prominent"
                data-ocid="user-menu-dropdown"
              >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleDashboardClick}
                  className="gap-2 cursor-pointer text-sm font-medium hover:bg-muted focus:bg-muted"
                  data-ocid="menu-dashboard"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleAuth}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-sm font-medium hover:bg-muted focus:bg-muted"
                  data-ocid="menu-logout"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAuthenticated && profileLoading ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-2 border-border bg-card"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="hidden sm:inline text-sm">Loading...</span>
            </Button>
          ) : (
            <Button
              onClick={handleAuth}
              disabled={disabled}
              size="sm"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated transition-all"
              data-ocid="login-btn"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {loginStatus === "logging-in" ? "Connecting…" : "Sign In"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
