import { fi } from "./fi";
import { en } from "./en";

export const locales = { fi, en };
export type LocaleKey = keyof typeof locales;
export type Messages = (typeof locales)[LocaleKey];
