import { NavLink, useLocation, Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, LayoutDashboard, LogIn, UserPlus, MessageSquare, ShieldCheck, Tag, CreditCard, Home } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";
import Logo from "@/components/Logo";
import type * as React from "react";

// Navigation configuration - update once, applies to both mobile and desktop
const getNavItems = (userRole?: string) => {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/account", label: "Account", icon: User },
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
{ to: "/pricing", label: "Pricing", icon: Tag },
{ to: "/billing", label: "Billing", icon: CreditCard },


  ];

  // Add admin/owner only routes
  if (userRole === "admin" || userRole === "owner") {
    items.push({
      to: "/reviews/moderation",
      label: "Review Moderation",
      icon: ShieldCheck,
    });
  }

  return items;
};

const getGuestNavItems = () => [
  { to: "/", label: "Home", icon: Home },
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/signin", label: "Sign in", icon: LogIn },
  { to: "/register", label: "Sign up", icon: UserPlus },
];

/** Nav link with "startsWith" matching so parent tabs stay active on subroutes */
const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <NavLink
      to={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
        ${active
          ? "bg-white/20 dark:bg-white/10 text-white shadow-sm "
          : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
    >
      {children}
    </NavLink>
  );
};

/** Mobile nav item with icons */
const MobileNavItem = ({
  to,
  children,
  icon: Icon
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ElementType;
}) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <NavLink
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
        ${active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const { data: profile } = useProfile();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.email;

  const initials =
    (profile?.display_name || user?.user_metadata?.name || user?.email || "U")
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const navItems = user ? getNavItems(profile?.role) : getGuestNavItems();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 shadow-lg">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#3B3A7A] via-[#4D9FFF] to-[#3B3A7A] opacity-100" />

      {/* Subtle animated overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />

      {/* Content */}
      <div className="relative container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden transition-all hover:scale-105 hover:bg-white/10 text-white border-white/20"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="border-b px-4 py-4">
                  <Logo showText={true} size="sm" to="/" />
                </div>
                <nav className="grid gap-1 p-3">
                  {!loading && navItems.map((item) => (
                    <MobileNavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                    >
                      {item.label}
                    </MobileNavItem>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Logo />

            {/* Desktop Navigation - Only show when logged in */}
            {!loading && user && (
              <>
                <Separator orientation="vertical" className="mx-3 hidden h-6 md:block bg-white/20" />
                <nav className="hidden items-center gap-1 md:flex">
                  {navItems.map((item) => (
                    <NavItem key={item.to} to={item.to}>
                      {item.label}
                    </NavItem>
                  ))}
                </nav>
              </>
            )}
          </div>

          {/* Right side: Auth */}
          {/* Right side: Auth */}
<div className="flex items-center gap-3">
  {loading ? (
    <div className="flex items-center gap-2">
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10  ring-1 ring-white/20" />
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10  ring-1 ring-white/20" />
    </div>
  ) : !user ? (
    <div className="flex items-center gap-2">
      <Button 
        asChild 
        variant="ghost"
        className="transition-all duration-200 hover:scale-110 bg-white/5 hover:bg-white/20 text-white border border-white/30 hover:border-white/60  shadow-lg hover:shadow-white/20 cursor-pointer"
      >
        <Link to="/signin" className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Sign in</span>
        </Link>
      </Button>
      <Button 
        asChild
        className="transition-all duration-200 hover:scale-110 bg-white hover:bg-[#FFD65A] text-[#3B3A7A] hover:text-[#1E1F24] shadow-xl hover:shadow-2xl hover:shadow-[#FFD65A]/50 border border-white/50 font-semibold cursor-pointer relative overflow-hidden group"
      >
        <Link to="/register" className="flex items-center gap-2 relative z-10">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Sign up</span>
        </Link>
      </Button>
    </div>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-2 transition-all duration-200 hover:scale-110 bg-white/5 hover:bg-white/20 text-white  border border-white/30 hover:border-white/60 shadow-lg hover:shadow-white/20 cursor-pointer"
        >
          <Avatar className="h-8 w-8 ring-2 ring-white/40 group-hover:ring-white/80 transition-all shadow-lg">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="avatar" />
            <AvatarFallback className="bg-gradient-to-br from-white/30 to-white/10 text-white font-bold text-xs ">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-medium drop-shadow-sm">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56  bg-background/95 border-white/10 shadow-2xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
          }}
          className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2 font-medium"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
</div>
        </div>
      </div>
    </header>
  );
}