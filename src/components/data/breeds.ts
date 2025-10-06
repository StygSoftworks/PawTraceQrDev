// src/data/breeds.ts

export type DogBreed = {
  name: string;
  defaultColors: string[]; // common colors people will recognize for quick-pick
};

export type CatPattern = {
  name: string;
  defaultColors: string[]; // "Seal point", "Black/Orange/White", etc.
};

export const DOG_BREEDS: DogBreed[] = [
  { name: "Golden Retriever", defaultColors: ["Golden"] },
  { name: "Labrador Retriever", defaultColors: ["Yellow", "Black", "Chocolate"] },
  { name: "German Shepherd", defaultColors: ["Black/Tan", "Sable", "Black"] },
  { name: "French Bulldog", defaultColors: ["Fawn", "Brindle", "Cream", "Pied"] },
  { name: "Poodle", defaultColors: ["White", "Black", "Apricot", "Red"] },
  { name: "Bulldog", defaultColors: ["Fawn", "Brindle", "White", "Piebald"] },
  { name: "Beagle", defaultColors: ["Tri-color", "Lemon/White", "Red/White"] },
  { name: "Rottweiler", defaultColors: ["Black/Rust"] },
  { name: "Dachshund", defaultColors: ["Red", "Black/Tan", "Chocolate/Tan", "Dapple"] },
  { name: "Yorkshire Terrier", defaultColors: ["Blue/Tan"] },
  // …add as many as you want; keep name + common colors only
];

export const CAT_PATTERNS: CatPattern[] = [
  { name: "Bicolor / Tuxedo", defaultColors: ["Black/White", "Gray/White", "Seal/White"] },
  { name: "Calico", defaultColors: ["Black/Orange/White", "Dilute (Blue/Cream/White)"] },
  { name: "Pointed", defaultColors: ["Seal point", "Blue point", "Chocolate point", "Lilac point", "Flame point"] },
  { name: "Shaded", defaultColors: ["Shaded Silver", "Shaded Golden"] },
  { name: "Smoke", defaultColors: ["Black Smoke", "Blue Smoke"] },
  { name: "Solid", defaultColors: ["Black", "White", "Blue/Gray", "Red/Orange", "Cream"] },
  { name: "Spotted", defaultColors: ["Brown Spotted", "Silver Spotted"] },
  { name: "Tabby", defaultColors: ["Brown Tabby", "Gray/Blue Tabby", "Orange Tabby", "Silver Tabby", "Torbie"] },
  { name: "Tortoiseshell (Tortie)", defaultColors: ["Black/Orange", "Chocolate/Cream", "Dilute (Blue/Cream)"] },
];

export function getDefaultColorsFor(
  species: "dog" | "cat" | "other" | undefined,
  selection: string | undefined
): string[] {
  if (!species || !selection) return [];
  if (species === "dog") {
    const item = DOG_BREEDS.find(b => b.name === selection);
    return item?.defaultColors ?? [];
  }
  if (species === "cat") {
    const item = CAT_PATTERNS.find(p => p.name === selection);
    return item?.defaultColors ?? [];
  }
  return [];
}

// Handy quick-pick names for selectors
export const DOG_BREED_NAMES = DOG_BREEDS.map(b => b.name);
export const CAT_PATTERN_NAMES = CAT_PATTERNS.map(p => p.name);
