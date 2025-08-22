import { getCurrentUser, signIn, signUp } from "@aws-amplify/auth";
import { useState } from "react";
import AuthActions from "./Components/AuthActions";
import strings from "../../locale/strings";
import { Logo } from "./Components/Logo";

export const Login = ({ setUser }: { setUser: (user: any) => void }) => {
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
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="w-full md:w-1/2 bg-[#f9fafb] flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="mb-8 flex flex-col items-center">
          <Logo size={128} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-2">{strings.authWelcome}</h1>
          <p className="text-sm text-gray-500 mb-8">{strings.authSubtitle}</p>
        </div>
        <input
          type="email"
          className="border px-4 py-2 w-full mb-4 rounded text-center"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border px-4 py-2 w-full mb-4 rounded text-center"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthActions
          mode={mode}
          loading={loading}
          error={error}
          disabled={loading || !email || !password}
          onAuth={(e) => handleAuth(e as any)}
          onToggleMode={() => setMode(mode === "signin" ? "signup" : "signin")}
        />
      </div>
      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white items-center justify-center p-8">
        <Logo size={512} />
      </div>
    </div>
  );
};
