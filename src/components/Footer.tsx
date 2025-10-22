// src/components/Footer.tsx
import { Link } from "react-router-dom";
import { TrustBadges } from "@/components/TrustBadges";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t bg-background/50 mt-auto ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4">
        <TrustBadges variant="inline" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PawTrace. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            {/* <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link> */}

            {/* Reviews */}
            <Link to="/reviews" className="hover:text-foreground transition-colors">
              Reviews
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}