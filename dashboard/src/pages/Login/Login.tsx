import { getCurrentUser, signIn, signUp } from "@aws-amplify/auth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthActions from "./Components/AuthActions";
import { Logo } from "./Components/Logo";

export const Login = ({ setUser }: { setUser: (user: any) => void }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      if (mode === "signin") {
        await signIn({ username: email, password });
      } else {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
      }
      const user = await getCurrentUser().catch(() => null);
      if (user) setUser(user);
    } catch (err: any) {
      console.error("Auth failed", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-dashboard flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
        {/* Left: form card */}
        <div className="relative bg-midnight-800/70 backdrop-blur-xl ring-1 ring-white/10 rounded-3xl p-8 sm:p-12 shadow-inner-soft flex flex-col justify-center">
          <div className="absolute inset-0 pointer-events-none rounded-3xl border border-white/5" />
          <div className="mb-8 flex flex-col items-center">
            <Logo size={96} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
            {t("authWelcome")}
          </h1>
          <p className="text-sm text-gray-400 mb-8">{t("authSubtitle")}</p>
          <div className="space-y-4">
            <div>
              <input
                type="email"
                autoComplete="email"
                className="w-full text-sm rounded-md bg-midnight-700/60 border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/40 text-gray-100 placeholder-gray-500 px-4 py-3 backdrop-blur-sm transition-colors"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full text-sm rounded-md bg-midnight-700/60 border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/40 text-gray-100 placeholder-gray-500 px-4 py-3 backdrop-blur-sm transition-colors"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <AuthActions
              mode={mode}
              loading={loading}
              error={error}
              disabled={loading || !email || !password}
              onAuth={(e) => handleAuth(e as any)}
              onToggleMode={() =>
                setMode(mode === "signin" ? "signup" : "signin")
              }
            />
          </div>
        </div>
        {/* Right: brand / hero */}
        <div className="hidden lg:flex relative items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-neon-purple/20 via-neon-pink/10 to-neon-cyan/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-8">
            <Logo size={280} />
            <p className="text-sm text-gray-400 max-w-sm text-center leading-relaxed">
              {t("heroTagline")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
