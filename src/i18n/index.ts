import "server-only";
import type { Locale } from "@/lib/i18n";
import en, { type Dictionary } from "./dictionaries/en";
import ms from "./dictionaries/ms";
import zh from "./dictionaries/zh";

const dictionaries: Record<Locale, Dictionary> = { en, ms, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { fmt } from "@/lib/i18n";
export type { Dictionary };
