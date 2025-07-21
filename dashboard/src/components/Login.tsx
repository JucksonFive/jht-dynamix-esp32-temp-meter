import { useState } from "react";
import { supabase } from "../supabase";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleAuth = async () => {
    if (mode === "signin") {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: login form */}
      <div className="w-1/2 bg-[#f9fafb] flex flex-col justify-center px-16">
        <div className="mb-8">
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

        <h1 className="text-3xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-8">
          Enter your credentials to access your dashboard
        </p>

        <input
          type="email"
          className="border px-4 py-2 w-full mb-4 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border px-4 py-2 w-full mb-4 rounded"
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

      <div className="w-1/2 bg-black text-white flex items-center justify-center">
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
