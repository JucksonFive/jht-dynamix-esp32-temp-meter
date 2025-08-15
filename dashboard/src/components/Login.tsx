import { useState } from "react";
import { getCurrentUser, signIn, signUp } from "@aws-amplify/auth";

export const Login = ({ setUser }: { setUser: (user: any) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn({ username: email, password });
      const user = await getCurrentUser();
      setUser(user);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="w-full md:w-1/2 bg-[#f9fafb] flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="mb-8 flex flex-col items-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="#2D9CDB"
              strokeWidth="4"
              fill="#F2F2F2"
            />
            <path
              d="M64 4 A60 60 0 0 1 64 124"
              stroke="#27AE60"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M4 64 A60 60 0 0 1 124 64"
              stroke="#EB5757"
              strokeWidth="3"
              fill="none"
            />
            <text
              x="64"
              y="72"
              textAnchor="middle"
              fontSize="18"
              fill="#333"
              fontFamily="Arial"
              fontWeight="bold"
            >
              JT-DYNAMIX
            </text>
          </svg>
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
        <button
          className="bg-black text-white py-2 rounded mb-4"
          onClick={handleAuth}
        >
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </button>

        <button
          className="text-sm text-blue-600 underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "Already have an account?"}
        </button>
      </div>

      <div className="hidden md:flex w-full md:w-1/2 bg-black text-white items-center justify-center p-8">
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="#2D9CDB"
            strokeWidth="4"
            fill="#F2F2F2"
          />
          <path
            d="M64 4 A60 60 0 0 1 64 124"
            stroke="#27AE60"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M4 64 A60 60 0 0 1 124 64"
            stroke="#EB5757"
            strokeWidth="3"
            fill="none"
          />
          <text
            x="64"
            y="72"
            textAnchor="middle"
            fontSize="18"
            fill="#333"
            fontFamily="Arial"
            fontWeight="bold"
          >
            JT-DYNAMIX
          </text>
        </svg>
      </div>
    </div>
  );
};
