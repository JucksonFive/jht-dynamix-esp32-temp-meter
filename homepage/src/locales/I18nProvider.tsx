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
  const [lang, setLang] = useState<LocaleKey>(defaultLang);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const saved = globalThis.localStorage.getItem(
      STORAGE_KEY
    ) as LocaleKey | null;
    if (saved && locales[saved]) {
      setLang(saved);
    }
  }, []);

  const setLangPersisted = useCallback((l: LocaleKey) => {
    setLang(l);
    if (globalThis.window === undefined) return;
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      return;
    }
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => (prev === "fi" ? "en" : "fi"));
  }, []);

  useEffect(() => {
    if (globalThis.document === undefined) return;
    globalThis.document.documentElement.lang = lang;
  }, [lang]);

  const value: I18nContextValue = useMemo(
    () => ({
      lang,
      t: locales[lang],
      setLang: setLangPersisted,
      toggle,
    }),
    [lang, setLangPersisted, toggle]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
