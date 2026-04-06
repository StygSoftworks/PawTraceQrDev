import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/auth/AuthProvider";
import { createPetWithPhotoAndTag } from "@/lib/onboarding";
import { useProfile } from "@/profile/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import { ImagePickerOptimize } from "@/components/ImagePickerOptimize";
import type { OptimizedImage } from "@/components/ImagePickerOptimize";
import {
  DOG_BREED_NAMES,
  CAT_PATTERN_NAMES,
  getDefaultColorsFor,
} from "@/components/data/breeds";
import { CircleAlert as AlertCircle, PawPrint, ChevronsUpDown, Camera } from "lucide-react";

const QuickPetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.enum(["dog", "cat", "other"], { message: "Choose a species" }),
  breed: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  photoPreview: z.string().optional(),
});

type FormValues = z.infer<typeof QuickPetSchema>;

type Props = {
  shortId: string;
  onComplete: (shortId: string) => void;
};

export function OnboardPetForm({ shortId, onComplete }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { data: profile, update: updateProfile } = useProfile();
  const optimizedBlobRef = React.useRef<Blob | null>(null);
  const [breedOpen, setBreedOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(QuickPetSchema),
    defaultValues: {
      name: "",
      species: undefined,
      breed: "",
      color: "",
      description: "",
      photoPreview: "",
    },
    mode: "onSubmit",
  });

  const species = form.watch("species");
  const selectedBreed = form.watch("breed");

  const breedOptions = React.useMemo(() => {
    if (species === "dog") return DOG_BREED_NAMES;
    if (species === "cat") return CAT_PATTERN_NAMES;
    return [];
  }, [species]);

  const colorSuggestions = React.useMemo(() => {
    return getDefaultColorsFor(species ?? "other", selectedBreed);
  }, [species, selectedBreed]);

  const handleSubmit = async (values: FormValues) => {
    if (!user?.id) return;
    setSubmitting(true);
    setServerError(null);

    try {
      let photoBlob = optimizedBlobRef.current;
      if (!photoBlob && values.photoPreview) {
        const res = await fetch(values.photoPreview);
        photoBlob = await res.blob();
      }

      await createPetWithPhotoAndTag(
        {
          owner_id: user.id,
          name: values.name,
          species: values.species,
          breed: values.breed || null,
          color: values.color || null,
          description: values.description || null,
        },
        shortId,
        photoBlob
      );

      if (profile?.has_created_first_pet === false) {
        await updateProfile.mutateAsync({ has_created_first_pet: true });
      }

      onComplete(shortId);
    } catch (err: any) {
      console.error(err);
      setServerError(err?.message ?? "Failed to create pet profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
          <PawPrint className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Tell Us About Your Pet</CardTitle>
        <CardDescription className="text-base">
          Just the basics -- you can add more details later
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <Alert variant="destructive" className="mb-4 animate-in fade-in-50 duration-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ob-name" className="text-sm font-medium">
              Pet's Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ob-name"
              placeholder="e.g., Milo, Luna, Max"
              {...form.register("name")}
              className="h-11"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Species <span className="text-destructive">*</span>
            </Label>
            <Select
              value={species}
              onValueChange={(v) => {
                form.setValue("species", v as FormValues["species"], { shouldValidate: true });
                form.setValue("breed", "");
                form.setValue("color", "");
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="What kind of pet?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.species && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.species.message}
              </p>
            )}
          </div>

          {species && (
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <Label className="text-sm font-medium">
                {species === "cat" ? "Pattern" : "Breed"}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={
                    species === "dog" ? "e.g., Golden Retriever"
                    : species === "cat" ? "e.g., Tabby, Calico"
                    : "e.g., Rabbit, Parrot"
                  }
                  {...form.register("breed")}
                  className="h-11 flex-1"
                />
                {breedOptions.length > 0 && (
                  <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-28 justify-between h-11">
                        Browse <ChevronsUpDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-64">
                      <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                          <CommandEmpty>No matches.</CommandEmpty>
                          <CommandGroup>
                            {breedOptions.map((b) => (
                              <CommandItem
                                key={b}
                                value={b}
                                onSelect={(val) => {
                                  form.setValue("breed", val);
                                  setBreedOpen(false);
                                }}
                              >
                                {b}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}

          {species && (
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <Label htmlFor="ob-color" className="text-sm font-medium">Color</Label>
              <Input
                id="ob-color"
                placeholder="e.g., Brown, White, Mixed"
                {...form.register("color")}
                className="h-11"
              />
              {colorSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {colorSuggestions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => form.setValue("color", c)}
                      className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium hover:bg-primary/10 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ob-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="ob-description"
              placeholder="Any distinguishing features, personality traits..."
              {...form.register("description")}
              className="min-h-[70px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Camera className="h-4 w-4 text-primary" />
              Photo
            </div>
            <ImagePickerOptimize
              label=""
              value={form.watch("photoPreview") ? {
                blob: new Blob(),
                dataUrl: form.watch("photoPreview")!,
                width: 0, height: 0, approxKB: 0, mimeType: "image/*",
                original: { name: "", sizeKB: 0, type: "" }
              } : null}
              onChange={(img: OptimizedImage | null) => {
                optimizedBlobRef.current = img?.blob ?? null;
                form.setValue("photoPreview", img?.dataUrl ?? "");
              }}
              options={{ maxWidth: 1200, maxHeight: 1200, quality: 0.82, preferWebP: true }}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 gap-2 text-base transition-all hover:scale-[1.02]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Setting up your tag...
              </span>
            ) : (
              <>
                <PawPrint className="h-4 w-4" />
                Create Pet Profile
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can add more details like weight, vaccinations, and contact info from your dashboard later.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
