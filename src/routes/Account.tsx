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

const ProfileSchema = z.object({
  display_name: z.string().min(1, "Please enter your name").max(80),
  avatar_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  phone: z.string().max(15, "Must be at most 15 characters").optional(),
  share_email: z.boolean().optional(),
  share_phone: z.boolean().optional(),

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
    defaultValues: { display_name: "", avatar_url: "", phone: "" },
  });

  useEffect(() => {
    // Load profile defaults when fetched
    if (profile) {
      reset({
        display_name: profile.display_name ?? "",
        avatar_url: profile.avatar_url ?? "",
        phone: profile.phone ?? "",
        share_email: profile.share_email ?? false,
        share_phone: profile.share_phone ?? false,
      });
    }
  }, [profile, reset]);

  // Password form
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
    await update.mutateAsync(vals); // upsert { id: user!.id, ...vals } inside hook
  };

  const onChangePassword = async (vals: PasswordForm) => {
    // Uses Supabase Auth to update password for current user
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
              <CardDescription>Manage your profile and sign-in details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Readonly basics */}
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={user.email ?? ""} disabled />
          </div>

          <Separator />

          {/* Profile form */}
          <form onSubmit={handleSubmit(onSaveProfile)} className="grid gap-4">
            
            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" placeholder="Jane Doe" {...register("display_name")} />
              {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
            </div>

            {/* Avatar URL */}
            <div className="grid gap-2">
              <Label htmlFor="avatar_url">Avatar URL (optional)</Label>
              <Input id="avatar_url" placeholder="https://…" {...register("avatar_url")} />
              {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url.message}</p>}
              {/* If you later want uploads, swap this for your ImagePickerOptimize and set avatar_url to a blob URL or uploaded URL */}
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Sharing Preferences */}
            <div className="grid gap-2">
              <Label>Sharing preferences</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("share_email")}
                    id="share_email"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    defaultChecked={profile?.share_email ?? false}
                  />
                  <Label htmlFor="share_email" className="select-none">
                    Share my email with pet finders
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("share_phone")}
                    id="share_phone"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    defaultChecked={profile?.share_phone ?? false}
                  />
                  <Label htmlFor="share_phone" className="select-none">
                    Share my phone number with pet finders
                  </Label>
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
                <AlertDescription>Profile updated.</AlertDescription>
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

          {/* Password change */}
          <form onSubmit={handleSubmitPw(onChangePassword)} className="grid gap-3">
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
