// src/lib/ids.ts
import { customAlphabet } from "nanoid";

// Use only lowercase letters + digits
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

// URL-safe, lower-case base36-ish; 12 chars ≈ ~62 bits entropy
export const makeShortId = customAlphabet(alphabet, 12);

export function makeAdaptiveShortId(length: number = 4) {
  const generator = customAlphabet(alphabet, length);
  return generator();
}