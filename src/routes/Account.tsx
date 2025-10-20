import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/ThemeSelector";
import { SocialMediaInput } from "@/components/SocialMediaInput";

const ProfileSchema = z.object({
  display_name: z.string().min(1, "Please enter your name").max(80),
  avatar_url: z.string().max(500).url("Must be a valid URL").or(z.literal("")).optional(),
  phone: z.string().max(15, "Must be at most 15 characters").optional(),
  share_email: z.boolean().optional(),
  share_phone: z.boolean().optional(),
  share_social_links: z.boolean().optional(),
  // Social media fields
  instagram: z.string().max(100).optional(),
  facebook: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  telegram: z.string().max(100).optional(),
  whatsapp: z.string().max(20).optional(),
  website: z.string().max(200).url("Must be a valid URL").or(z.literal("")).optional(),
});

type ProfileForm = z.infer<typeof ProfileSchema>;

const PasswordSchema = z.object({
  new_password: z.string().min(8, "At least 8 characters"),
});

type PasswordForm = z.infer<typeof PasswordSchema>;

export default function Account() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading, update } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: savingProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { 
      display_name: "", 
      avatar_url: "", 
      phone: "",
      instagram: "",
      facebook: "",
      twitter: "",
      telegram: "",
      whatsapp: "",
      website: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        display_name: profile.display_name ?? "",
        avatar_url: profile.avatar_url ?? "",
        phone: profile.phone ?? "",
        share_email: profile.share_email ?? false,
        share_phone: profile.share_phone ?? false,
        share_social_links: profile.share_social_links ?? false,
        instagram: profile.instagram ?? "",
        facebook: profile.facebook ?? "",
        twitter: profile.twitter ?? "",
        telegram: profile.telegram ?? "",
        whatsapp: profile.whatsapp ?? "",
        website: profile.website ?? "",
      });
    }
  }, [profile, reset]);

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: savingPw },
  } = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { new_password: "" },
  });

  const onSaveProfile = async (vals: ProfileForm) => {
    await update.mutateAsync(vals);
  };

  const onChangePassword = async (vals: PasswordForm) => {
    const { error } = await (await import("@/lib/supabase")).supabase.auth.updateUser({
      password: vals.new_password,
    });
    if (error) throw error;
    resetPw({ new_password: "" });
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, appearance, and security settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile & Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your profile and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={user.email ?? ""} disabled />
              </div>

              <Separator />

              <form onSubmit={handleSubmit(onSaveProfile)} className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="display_name">Display name</Label>
                  <Input id="display_name" placeholder="Jane Doe" {...register("display_name")} />
                  {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="avatar_url">Avatar URL (optional)</Label>
                  <Input id="avatar_url" placeholder="https://…" {...register("avatar_url")} />
                  {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone number (optional)</Label>
                  <Input id="phone" placeholder="+1 (555) 123-4567" {...register("phone")} />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>

                <Separator />

                <SocialMediaInput register={register} errors={errors} />

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Privacy & Sharing</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Control what information is visible when someone scans your pet's QR code
                    </p>
                  </div>
                  
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register("share_email")}
                        id="share_email"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <Label htmlFor="share_email" className="cursor-pointer font-medium">
                          Share my email address
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Allow pet finders to contact you via email
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register("share_phone")}
                        id="share_phone"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <Label htmlFor="share_phone" className="cursor-pointer font-medium">
                          Share my phone number
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Allow pet finders to call or text you
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register("share_social_links")}
                        id="share_social_links"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <Label htmlFor="share_social_links" className="cursor-pointer font-medium">
                          Share my social media & website links
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Display your social media profiles to pet finders
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {update.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>{String((update.error as any)?.message ?? "Save failed")}</AlertDescription>
                  </Alert>
                )}
                {update.isSuccess && (
                  <Alert>
                    <AlertDescription>Profile updated successfully.</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={savingProfile || isLoading}>
                    {savingProfile ? "Saving…" : "Save changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => reset()}>
                    Reset
                  </Button>
                </div>
              </form>

              <Separator />

              <form onSubmit={handleSubmitPw(onChangePassword)} className="grid gap-3">
                <div>
                  <Label className="text-base font-semibold">Change Password</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update your password to keep your account secure
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input id="new_password" type="password" placeholder="••••••••" {...registerPw("new_password")} />
                  {pwErrors.new_password && (
                    <p className="text-sm text-destructive">{pwErrors.new_password.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={savingPw}>
                    {savingPw ? "Updating…" : "Update password"}
                  </Button>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{user.email}</span>
              </div>
              <Button variant="ghost" onClick={() => signOut()}>
                Sign out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <ThemeSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}