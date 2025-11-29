import { NavLink, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, LogIn, UserPlus, MessageSquare, ShieldCheck, CreditCard, Hop as Home, LayoutDashboard, User, Moon, Sun, Info } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";
import { useTheme } from "@/hooks/useTheme";
import Logo from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
import type * as React from "react";
import { useState } from "react";

const getAuthenticatedNavItems = (userRole?: string) => {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/account", label: "Account", icon: User },
    //{ to: "/pricing", label: "Pricing", icon: Tag },
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
    { to: "/about", label: "About", icon: Info },
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
  { to: "/about", label: "About", icon: Info },
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
  icon: Icon,
  onClick,
  index = 0
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ElementType;
  onClick?: () => void;
  index?: number;
}) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
  return (
    <NavLink
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-4 rounded-lg px-4 py-3.5 text-base font-medium transition-all duration-200
        animate-in slide-in-from-left fade-in
        ${active
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-foreground hover:bg-primary/10 hover:translate-x-1"
        }`}
      style={{
        animationDelay: `${index * 50}ms`,
        animationDuration: '400ms'
      }}
    >
      <Icon className="h-5 w-5" />
      {children}
    </NavLink>
  );
};

export default function Header() {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user ? getAuthenticatedNavItems(profile?.role) : getPublicNavItems();

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b shadow-lg backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-header via-primary-dark to-accent-header" />

      <div className="relative container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-white/10 text-white transition-transform active:scale-95"
                >
                  <Menu className="h-5 w-5 transition-transform" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" fullScreen className="p-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-header via-primary-dark to-accent-header" />
                <div className="relative flex flex-col h-full">
                  <div className="border-b px-6 py-5 bg-black/20 backdrop-blur-sm" onClick={handleMobileNavClick}>
                    <Logo showText={true} size="sm" to="/" />
                  </div>
                  <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                    {!loading && navItems.map((item, index) => (
                      <MobileNavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        onClick={handleMobileNavClick}
                        index={index}
                      >
                        {item.label}
                      </MobileNavItem>
                    ))}

                    {!loading && !user && (
                      <>
                        <Separator className="my-4" />
                        <MobileNavItem
                          to="/signin"
                          icon={LogIn}
                          onClick={handleMobileNavClick}
                          index={navItems.length}
                        >
                          Sign in
                        </MobileNavItem>
                        <MobileNavItem
                          to="/register"
                          icon={UserPlus}
                          onClick={handleMobileNavClick}
                          index={navItems.length + 1}
                        >
                          Sign up
                        </MobileNavItem>
                      </>
                    )}
                  </nav>
                  <div className="border-t px-6 py-4 bg-black/20 backdrop-blur-sm">
                    <p className="text-xs text-white/70 text-center">
                      © {new Date().getFullYear()} PawTrace
                    </p>
                  </div>
                </div>
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

          {/* Right side: Theme Toggle + Auth */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover:bg-white/10 text-white"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}
