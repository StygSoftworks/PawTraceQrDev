import { NavLink, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, LogIn, UserPlus, MessageSquare, ShieldCheck, Tag, CreditCard, Hop as Home, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";
import Logo from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
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
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-primary/10"
        }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

export default function Header() {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();

  const navItems = user ? getAuthenticatedNavItems(profile?.role) : getPublicNavItems();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 shadow-lg backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-coral via-brand-peach to-brand-teal opacity-95" />

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
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
