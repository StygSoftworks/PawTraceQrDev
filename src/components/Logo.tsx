// src/components/Logo.tsx
import { Link } from "react-router-dom";

interface LogoProps {
  to?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const textSizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export default function Logo({ 
  to = "/", 
  size = "md", 
  showText = true,
  className = "" 
}: LogoProps) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 group ${className}`}
    >
      {/* Logo with glow effect */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Logo image with backdrop */}
        <div className="relative bg-white/10  rounded-lg p-1.5 ring-1 ring-white/20 group-hover:ring-white/40 transition-all duration-300 group-hover:scale-110">
          <img 
            src="/PawTraceQRLogo.svg" 
            alt="PawTrace Logo" 
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>
      </div>
      
      {/* Text with gradient */}
      {showText && (
        <span className={`
          ${textSizeClasses[size]} 
          font-bold 
          bg-gradient-to-r from-white via-white to-white/80
          bg-clip-text text-transparent
          drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]
          group-hover:drop-shadow-[0_2px_12px_rgba(255,255,255,0.5)]
          transition-all duration-300
        `}>
          PawTrace QR
        </span>
      )}
    </Link>
  );
}