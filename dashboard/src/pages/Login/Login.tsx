import { getCurrentUser, signIn, signUp } from "@aws-amplify/auth";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import AuthActions from "src/pages/Login/Components/AuthActions";
import { Logo } from "src/pages/Login/Components/Logo";
import { getRuntimeConfig } from "src/utils/runtimeConfig";
import { Nullable } from "src/utils/types";

const LoginScene = lazy(() => import("src/pages/Login/Components/LoginScene"));

export const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<Nullable<string>>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const cfg = getRuntimeConfig();
      if (
        !cfg.VITE_COGNITO_USER_POOL_ID ||
        !cfg.VITE_COGNITO_USER_POOL_CLIENT_ID
      ) {
        throw new Error(
          "Authentication is not configured. Please ensure runtime config is loaded.",
        );
      }
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
      if (user) {
        // Trigger re-authentication by signing out and letting context re-initialize
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error("Auth failed", err);
      const msg: string =
        (err instanceof Error ? err.message : null) || "Authentication failed";
      const friendly = /UserPool not configured/i.test(msg)
        ? "Authentication is not configured. Please check /config and Cognito settings."
        : msg;
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-100 dark:bg-[#0f0d0d] flex items-center justify-center px-4 py-10 transition-colors duration-200 overflow-hidden">
      {/* Full-page particle background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <LoginScene className="w-full h-full" />
        </Suspense>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8">
        {/* Left: form card */}
        <div className="bg-neutral-50/90 dark:bg-[#1a1717]/90 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-200 dark:border-[#2d2626] p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 flex flex-col items-center">
            <Logo size={96} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-neutral-900 dark:text-[#f5f0f0]">
            {t("authWelcome")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-[#a39999] mb-8">
            {t("authSubtitle")}
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="email"
                autoComplete="email"
                className="w-full text-sm bg-neutral-50 dark:bg-[#231f1f] border border-neutral-200 dark:border-[#2d2626] rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-neutral-900 dark:text-[#f5f0f0] placeholder-neutral-400 dark:placeholder-[#5d5050] px-4 py-3 transition-colors"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full text-sm bg-neutral-50 dark:bg-[#231f1f] border border-neutral-200 dark:border-[#2d2626] rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-neutral-900 dark:text-[#f5f0f0] placeholder-neutral-400 dark:placeholder-[#5d5050] px-4 py-3 transition-colors"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <AuthActions
              mode={mode}
              loading={loading}
              error={error}
              disabled={loading || !email || !password}
              onAuth={(e) => handleAuth(e as unknown as React.FormEvent)}
              onToggleMode={() =>
                setMode(mode === "signin" ? "signup" : "signin")
              }
            />
          </div>
        </div>
        {/* Right: logo + tagline (transparent, sits on particle bg) */}
        <div className="hidden lg:flex relative items-center justify-center min-h-[480px]">
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <Logo size={280} />
            <p className="mt-8 text-sm text-neutral-500 dark:text-[#a39999] max-w-sm text-center leading-relaxed">
              {t("heroTagline")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
