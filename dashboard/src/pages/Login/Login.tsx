import { useState } from "react";
import { getCurrentUser, signIn, signUp } from "@aws-amplify/auth";
import { Logo } from "./Components/Logo";
import { LoadingSpinner } from "./Components/LoadingSpinner";
import { Button } from "../../ui/Button";

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
          <h1 className="text-3xl font-semibold mb-2">Welcome</h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter your credentials to access your dashboard
          </p>
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
        <Button
          intent="primary"
          size="md"
          onClick={handleAuth}
          disabled={loading || !email || !password}
          aria-busy={loading}
          className="w-full mb-4 gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner
                size={20}
                label={mode === "signin" ? "Signing In" : "Signing Up"}
              />
              <span>
                {mode === "signin" ? "Signing In..." : "Signing Up..."}
              </span>
            </>
          ) : (
            <span>{mode === "signin" ? "Sign In" : "Sign Up"}</span>
          )}
        </Button>
        {error && (
          <div className="text-red-600 text-sm mb-2 text-center">{error}</div>
        )}

        <Button
          intent="link"
          size="sm"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "Already have an account?"}
        </Button>
      </div>

      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white items-center justify-center p-8">
        <Logo size={512} />
      </div>
    </div>
  );
};
