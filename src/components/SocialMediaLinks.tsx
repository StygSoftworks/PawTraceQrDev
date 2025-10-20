// src/components/SocialMediaLinks.tsx
import { Instagram, Facebook, Twitter, MessageCircle, Phone as WhatsAppIcon, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type SocialLink = {
  platform: string;
  value: string | null | undefined;
  icon: React.ReactNode;
  color: string;
  getUrl: (value: string) => string;
};

const normalizeHandle = (value: string): string => {
  // Remove @ if present, trim whitespace
  return value.trim().replace(/^@/, "");
};

const normalizeUrl = (value: string): string => {
  // If it's already a URL, return it
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  // Otherwise add https://
  return `https://${value}`;
};

type SocialMediaLinksProps = {
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  website?: string | null;
};

export function SocialMediaLinks({
  instagram,
  facebook,
  twitter,
  telegram,
  whatsapp,
  website,
}: SocialMediaLinksProps) {
  const links: SocialLink[] = [
    {
      platform: "Instagram",
      value: instagram,
      icon: <Instagram className="h-4 w-4" />,
      color: "hover:bg-pink-50 hover:border-pink-200 dark:hover:bg-pink-950 dark:hover:border-pink-900",
      getUrl: (val) => {
        const handle = normalizeHandle(val);
        return val.includes("instagram.com") 
          ? normalizeUrl(val)
          : `https://instagram.com/${handle}`;
      },
    },
    {
      platform: "Facebook",
      value: facebook,
      icon: <Facebook className="h-4 w-4" />,
      color: "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-900",
      getUrl: (val) => {
        return val.includes("facebook.com") || val.includes("fb.com")
          ? normalizeUrl(val)
          : `https://facebook.com/${normalizeHandle(val)}`;
      },
    },
    {
      platform: "Twitter/X",
      value: twitter,
      icon: <Twitter className="h-4 w-4" />,
      color: "hover:bg-sky-50 hover:border-sky-200 dark:hover:bg-sky-950 dark:hover:border-sky-900",
      getUrl: (val) => {
        const handle = normalizeHandle(val);
        return val.includes("twitter.com") || val.includes("x.com")
          ? normalizeUrl(val)
          : `https://x.com/${handle}`;
      },
    },
    {
      platform: "Telegram",
      value: telegram,
      icon: <MessageCircle className="h-4 w-4" />,
      color: "hover:bg-cyan-50 hover:border-cyan-200 dark:hover:bg-cyan-950 dark:hover:border-cyan-900",
      getUrl: (val) => {
        const handle = normalizeHandle(val);
        return val.includes("t.me")
          ? normalizeUrl(val)
          : `https://t.me/${handle}`;
      },
    },
    {
      platform: "WhatsApp",
      value: whatsapp,
      icon: <WhatsAppIcon className="h-4 w-4" />,
      color: "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950 dark:hover:border-green-900",
      getUrl: (val) => {
        // Remove all non-digit characters
        const cleaned = val.replace(/\D/g, "");
        return `https://wa.me/${cleaned}`;
      },
    },
    {
      platform: "Website",
      value: website,
      icon: <Globe className="h-4 w-4" />,
      color: "hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-950 dark:hover:border-slate-800",
      getUrl: (val) => normalizeUrl(val),
    },
  ];

  const availableLinks = links.filter((link) => link.value);

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Globe className="h-4 w-4" />
        Connect via Social Media
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableLinks.map((link) => (
          <Button
            key={link.platform}
            variant="outline"
            size="sm"
            asChild
            className={`gap-2 transition-colors ${link.color}`}
          >
            <a
              href={link.getUrl(link.value!)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full"
            >
              <span className="flex items-center gap-2">
                {link.icon}
                {link.platform}
              </span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}