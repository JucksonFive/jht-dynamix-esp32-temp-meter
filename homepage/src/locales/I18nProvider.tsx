import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LocaleKey, locales } from "./index";

type AnyMessages = (typeof locales)[LocaleKey];
interface I18nContextValue {
  lang: LocaleKey;
  t: AnyMessages;
  setLang: (lang: LocaleKey) => void;
  toggle: () => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "jt-dynamix-lang";

export const I18nProvider: React.FC<{
  defaultLang?: LocaleKey;
  children: React.ReactNode;
}> = ({ defaultLang = "fi", children }) => {
  const [lang, setLangState] = useState<LocaleKey>(defaultLang);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY) as LocaleKey | null)
        : null;
    if (saved && locales[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: LocaleKey) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => (prev === "fi" ? "en" : "fi"));
  }, []);

  const value: I18nContextValue = useMemo(
    () => ({
      lang,
      t: locales[lang],
      setLang,
      toggle,
    }),
    [lang, setLang, toggle]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
