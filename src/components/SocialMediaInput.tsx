// src/components/SocialMediaInput.tsx
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Instagram, Facebook, Twitter, MessageCircle, Phone as WhatsAppIcon, Globe } from "lucide-react";

type SocialPlatform = {
  name: string;
  key: string;
  icon: React.ReactNode;
  placeholder: string;
  prefix?: string;
  description?: string;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: "Instagram",
    key: "instagram",
    icon: <Instagram className="h-4 w-4" />,
    placeholder: "@username or profile URL",
    description: "Instagram handle or profile link",
  },
  {
    name: "Facebook",
    key: "facebook",
    icon: <Facebook className="h-4 w-4" />,
    placeholder: "Profile URL or username",
    description: "Facebook profile link",
  },
  {
    name: "Twitter/X",
    key: "twitter",
    icon: <Twitter className="h-4 w-4" />,
    placeholder: "@username or profile URL",
    description: "Twitter/X handle or profile link",
  },
  {
    name: "Telegram",
    key: "telegram",
    icon: <MessageCircle className="h-4 w-4" />,
    placeholder: "@username or t.me link",
    description: "Telegram username or profile link",
  },
  {
    name: "WhatsApp",
    key: "whatsapp",
    icon: <WhatsAppIcon className="h-4 w-4" />,
    placeholder: "+1234567890",
    description: "WhatsApp phone number",
  },
  {
    name: "Website",
    key: "website",
    icon: <Globe className="h-4 w-4" />,
    placeholder: "https://yourwebsite.com",
    description: "Personal website or blog",
  },
];

type SocialMediaInputProps = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  showLabels?: boolean;
};

export function SocialMediaInput({ register, errors, showLabels = true }: SocialMediaInputProps) {
  return (
    <div className="space-y-4">
      {showLabels && (
        <div>
          <Label className="text-base font-semibold">Social Media & Contact Links</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add social media profiles or other ways people can reach you (optional)
          </p>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.key} className="space-y-2">
            <Label 
              htmlFor={platform.key} 
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span className="text-muted-foreground">{platform.icon}</span>
              {platform.name}
            </Label>
            <Input
              id={platform.key}
              placeholder={platform.placeholder}
              {...register(platform.key)}
              className="h-10"
            />
            {errors[platform.key] && (
              <p className="text-sm text-destructive">
                {errors[platform.key]?.message as string}
              </p>
            )}
            {platform.description && !errors[platform.key] && (
              <p className="text-xs text-muted-foreground">{platform.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}