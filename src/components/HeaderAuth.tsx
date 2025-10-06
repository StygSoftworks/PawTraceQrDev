import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutDashboard, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";

export function HeaderAuth() {
  const { user, loading, signOut } = useAuth();
  const { data: profile } = useProfile();

  const displayName =
    profile?.display_name || user?.user_metadata?.name || user?.email;

  const initials = (
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "U"
  )
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 animate-pulse rounded-lg bg-white/10" />
        <div className="hidden sm:block h-9 w-24 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all"
        >
          <Link to="/signin" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Sign in</span>
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-[#4D9FFF] hover:bg-[#3D8FEF] text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Link to="/register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Sign up</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 h-10 px-3 text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all bg-white/5 backdrop-blur-sm"
        >
          <Avatar className="h-7 w-7 ring-2 ring-white/30">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="avatar" />
            <AvatarFallback className="bg-[#4D9FFF] text-white font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-medium text-sm truncate max-w-32">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900">
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
          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer"
          >
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
  );
}
