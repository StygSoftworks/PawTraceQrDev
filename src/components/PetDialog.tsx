import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateAndStorePetQr } from "@/lib/qr";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronsUpDown, PawPrint, Palette, Calendar, Weight, FileText, Syringe, Camera, CircleAlert as AlertCircle, Sparkles, Check } from "lucide-react";
import {
  DOG_BREED_NAMES,
  CAT_PATTERN_NAMES,
  getDefaultColorsFor,
} from "./data/breeds";
import { ImagePickerOptimize } from "@/components/ImagePickerOptimize";
import type { OptimizedImage } from "@/components/ImagePickerOptimize";

import { useAuth } from "@/auth/AuthProvider";
import { createPet, updatePet, uploadPetPhoto } from "@/lib/pets";
import { supabase } from "@/lib/supabase";
import { THEME_PRESETS } from "@/lib/themes";
import { usePetTheme } from "@/hooks/usePetTheme";
import { cn } from "@/lib/utils";

/* ---------------------------- Zod Schema ---------------------------- */

const PetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  species: z.enum(["dog", "cat", "other"], { message: "Choose a species" }),
  breed: z.string().optional(),
  color: z.string().optional(),
  weight: z
    .number()
    .min(0, "Weight must be positive")
    .optional(),
  birthdate: z.string().optional(),
  microchipId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  vaccinations: z.object({
    rabies: z.boolean().default(false),
    rabiesExpires: z.string().optional(),
  }).default({ rabies: false, rabiesExpires: "" }),
  photoPreview: z.string().optional(),
});

export type PetFormValues = z.input<typeof PetSchema>;

type Mode = "add" | "edit";

type Props = {
  mode: Mode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialPet?: Partial<PetFormValues>;
  onSubmit?: (values: PetFormValues) => void;
};

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export function PetDialog({ mode, open, onOpenChange, initialPet, onSubmit }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<PetFormValues>({
    resolver: zodResolver(PetSchema),
    defaultValues: {
      id: initialPet?.id,
      name: initialPet?.name ?? "",
      species: initialPet?.species as PetFormValues["species"] | undefined,
      breed: initialPet?.breed ?? "",
      color: initialPet?.color ?? "",
      weight: (initialPet?.weight as number | undefined) ?? undefined,
      birthdate: initialPet?.birthdate ?? "",
      microchipId: initialPet?.microchipId ?? "",
      description: initialPet?.description ?? "",
      notes: initialPet?.notes ?? "",
      vaccinations: {
        rabies: initialPet?.vaccinations?.rabies ?? false,
        rabiesExpires: initialPet?.vaccinations?.rabiesExpires ?? "",
      },
      photoPreview: initialPet?.photoPreview ?? "",
    },
    mode: "onSubmit",
  });

  const species = form.watch("species");
  const selectedBreedOrPattern = form.watch("breed");

  const [breedOpen, setBreedOpen] = React.useState(false);

  const { themeId, updatePetTheme } = usePetTheme(initialPet?.id);
  const [selectedTheme, setSelectedTheme] = React.useState(themeId);

  React.useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);
  const optimizedBlobRef = React.useRef<Blob | null>(null);

  const breedOptions = React.useMemo(() => {
    if (species === "dog") return DOG_BREED_NAMES;
    if (species === "cat") return CAT_PATTERN_NAMES;
    return [];
  }, [species]);

  const colorSuggestions = React.useMemo(() => {
    return getDefaultColorsFor(species ?? "other", selectedBreedOrPattern);
  }, [species, selectedBreedOrPattern]);

  const handleSubmit = async (values: PetFormValues) => {
    if (!user?.id) {
      alert("You must be signed in.");
      return;
    }
    setSubmitting(true);

    const vaccinations = {
      rabies: !!values.vaccinations?.rabies,
      rabiesExpires: values.vaccinations?.rabies
        ? (values.vaccinations.rabiesExpires || undefined)
        : undefined,
    };

    const basePayload = {
      owner_id: user.id,
      name: values.name,
      species: values.species,
      breed: values.breed || null,
      color: values.color || null,
      weight: typeof values.weight === "number" ? values.weight : null,
      birthdate: values.birthdate || null,
      microchip_id: values.microchipId || null,
      description: values.description || null,
      notes: values.notes || null,
      vaccinations,
    } as const;

    try {
      let row;

      if (mode === "add") {
        row = await createPet({ ...basePayload });

        if (row.qr_code?.short_id && !row.qr_code?.qr_url) {
          try {
            const qrUrl = await generateAndStorePetQr(user.id, row.qr_code.short_id);
            await supabase
              .from("qr_codes")
              .update({ qr_url: qrUrl })
              .eq("id", row.qr_code.id);
          } catch (e) {
            console.warn("QR generation failed (non-blocking):", (e as any)?.message);
          }
        }

        let uploadBlob = optimizedBlobRef.current;
        if (!uploadBlob && values.photoPreview) {
          uploadBlob = await dataUrlToBlob(values.photoPreview);
        }
        if (uploadBlob && uploadBlob.size > 0) {
          const publicUrl = await uploadPetPhoto(user.id, row.id, uploadBlob);
          row = await updatePet(row.id, { photo_url: publicUrl });
        }
      } else {
        const id = values.id || initialPet?.id;
        if (!id) throw new Error("Missing pet id for update.");

        let uploadBlob = optimizedBlobRef.current;
        if (!uploadBlob && values.photoPreview) {
          uploadBlob = await dataUrlToBlob(values.photoPreview);
        }

        const patch: any = {
          name: basePayload.name,
          species: basePayload.species,
          breed: basePayload.breed,
          color: basePayload.color,
          weight: basePayload.weight,
          birthdate: basePayload.birthdate,
          microchip_id: basePayload.microchip_id,
          description: basePayload.description,
          notes: basePayload.notes,
          vaccinations: basePayload.vaccinations,
        };

        if (uploadBlob && uploadBlob.size > 0) {
          const publicUrl = await uploadPetPhoto(user.id, id, uploadBlob);
          patch.photo_url = publicUrl;
        }

        row = await updatePet(id, patch);
      }

      if (row?.id) {
        await updatePetTheme(selectedTheme);
      }

      onSubmit?.(values);
      onOpenChange(false);
      if (mode === "add") form.reset();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Failed to save pet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <PawPrint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {mode === "add" ? "Add New Pet" : "Edit Pet"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {mode === "add"
                  ? "Enter your pet's details to create their profile"
                  : "Update your pet's information"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Basic Information
            </div>
            
            <div className="space-y-4 pl-6 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="name" 
                  {...form.register("name")} 
                  placeholder="e.g., Milo, Luna, Max"
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in-50">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Species <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={species}
                    onValueChange={(v) => {
                      form.setValue("species", v as PetFormValues["species"], { shouldValidate: true });
                      form.setValue("breed", "");
                      form.setValue("color", "");
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">🐕 Dog</SelectItem>
                      <SelectItem value="cat">🐱 Cat</SelectItem>
                      <SelectItem value="other">🐾 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.species && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {form.formState.errors.species.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Birthdate
                  </Label>
                  <Input 
                    id="birthdate" 
                    type="date" 
                    {...form.register("birthdate")}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PawPrint className="h-3.5 w-3.5" />
                  {species === "cat" ? "Pattern" : "Breed"}
                  {species === "other" && <span className="text-muted-foreground text-xs">(optional)</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      species === "dog"
                        ? "e.g., Golden Retriever"
                        : species === "cat"
                          ? "e.g., Tabby, Calico"
                          : "e.g., Rabbit, Guinea Pig"
                    }
                    {...form.register("breed")}
                    className="h-11 flex-1"
                  />
                  {breedOptions.length > 0 && (
                    <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-36 justify-between h-11"
                        >
                          Suggestions <ChevronsUpDown className="h-4 w-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-64">
                        <Command>
                          <CommandInput placeholder="Search…" />
                          <CommandList>
                            <CommandEmpty>No matches found.</CommandEmpty>
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

              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5" />
                  Color
                </Label>
                <Input 
                  id="color" 
                  {...form.register("color")} 
                  placeholder="e.g., Brown, White, Mixed"
                  className="h-11"
                />
                {colorSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {colorSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => form.setValue("color", c, { shouldValidate: true })}
                        className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium hover:bg-primary/10 transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-2">
                    <Weight className="h-3.5 w-3.5" />
                    Weight (lbs)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 45.5"
                    {...form.register("weight", { valueAsNumber: true })}
                    className="h-11"
                  />
                  {form.formState.errors.weight && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {form.formState.errors.weight.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="microchipId" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Microchip ID
                  </Label>
                  <Input 
                    id="microchipId" 
                    {...form.register("microchipId")} 
                    placeholder="e.g., 981000012345678"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Physical Description
                </Label>
                <Input 
                  id="description" 
                  {...form.register("description")} 
                  placeholder="e.g., White paws, brown spot on left ear"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes
                </Label>
                <Textarea 
                  id="notes" 
                  {...form.register("notes")} 
                  placeholder="Allergies, medications, behavioral notes, vet contact info..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Vaccinations Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Syringe className="h-4 w-4 text-primary" />
              Vaccinations
            </div>
            
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                  Keep track of your pet's vaccination records for their health and safety
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    id="rabies"
                    type="checkbox"
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    checked={!!form.watch("vaccinations.rabies")}
                    onChange={(e) => form.setValue("vaccinations.rabies", e.target.checked)}
                  />
                  <Label htmlFor="rabies" className="text-sm font-medium cursor-pointer">
                    Rabies Vaccination
                  </Label>
                </div>

                <div className="flex items-center gap-2 sm:w-48">
                  <Label htmlFor="rabiesExpires" className="text-xs text-muted-foreground whitespace-nowrap">
                    Expires:
                  </Label>
                  <Input
                    id="rabiesExpires"
                    type="date"
                    disabled={!form.watch("vaccinations.rabies")}
                    {...form.register("vaccinations.rabiesExpires")}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Theme Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Palette className="h-4 w-4 text-primary" />
              Page Theme
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-4">
                Choose a color theme for your pet's public page
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(THEME_PRESETS).map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                      selectedTheme === theme.id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-16 rounded-md mb-2 bg-gradient-to-br",
                      theme.previewGradient
                    )} />
                    <p className="text-xs font-medium text-center">{theme.name}</p>
                    {selectedTheme === theme.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <Separator />

          {/* Photo Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              Pet Photo
            </div>
            
            <div className="pl-6 border-l-2 border-primary/20">
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
          </section>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={submitting}
              className="transition-all hover:scale-105"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="transition-all hover:scale-105"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === "add" ? "Creating..." : "Updating..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4" />
                  {mode === "add" ? "Create Pet Profile" : "Save Changes"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}