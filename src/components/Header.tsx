import { NavLink, useLocation, Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, LayoutDashboard, LogIn, UserPlus, MessageSquare, ShieldCheck, Tag, CreditCard, Hop as Home } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";
import Logo from "@/components/Logo";
import type * as React from "react";

const getAuthenticatedNavItems = (userRole?: string) => {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/account", label: "Account", icon: User },
    { to: "/pricing", label: "Pricing", icon: Tag },
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  if (userRole === "admin" || userRole === "owner") {
    items.push({
      to: "/reviews/moderation",
      label: "Review Moderation",
      icon: ShieldCheck,
    });
  }

  return items;
};

const getPublicNavItems = () => [
  { to: "/", label: "Home", icon: Home },
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/reviews", label: "Reviews", icon: MessageSquare },
];

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
  return (
    <NavLink
      to={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${active
          ? "bg-white/20 text-white"
          : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
    >
      {children}
    </NavLink>
  );
};

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
  const active = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
  return (
    <NavLink
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
        ${active
          ? "bg-[#4D9FFF] text-white"
          : "text-foreground hover:bg-[#4D9FFF]/10"
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

  const navItems = user ? getAuthenticatedNavItems(profile?.role) : getPublicNavItems();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 shadow-lg backdrop-blur-sm">
      <div className="absolute inset-0 bg-[#1E1F24]/95" />

      <div className="relative container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-white/10 text-white"
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

                  {!loading && !user && (
                    <>
                      <Separator className="my-2" />
                      <MobileNavItem to="/signin" icon={LogIn}>
                        Sign in
                      </MobileNavItem>
                      <MobileNavItem to="/register" icon={UserPlus}>
                        Sign up
                      </MobileNavItem>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Logo />

            {/* Desktop Navigation - Show for both logged in and out */}
            {!loading && (
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
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
              </div>
            ) : !user ? (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className="hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                >
                  <Link to="/signin" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline font-medium">Sign in</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#4D9FFF] hover:bg-[#4D9FFF]/90 text-white border-0 font-medium cursor-pointer"
                >
                  <Link to="/register" className="flex items-center gap-2">
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
                    className="gap-2 hover:bg-white/10 text-white cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-white/20">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt="avatar" />
                      <AvatarFallback className="bg-[#4D9FFF]/20 text-white font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
                  <DropdownMenuSeparator />
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
