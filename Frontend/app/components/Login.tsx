"use client";

import { alconica } from "../libs/fonts";
import { useState } from "react";
import { useCusAuthStore } from "../ZustandStore/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  //<"customer" | "seller"> this is typescript type union..this mean userType can be only customer or seller
  const [userType, setUserType] = useState<"customer" | "seller">("customer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading, error } = useCusAuthStore();

   const showToast = (message: string, type: "success" | "error") => {
    // Dispatch a custom event that the Toast component listens for
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(email, password);

    if (success) {
      const role = localStorage.getItem("role");
      
      // Show success toast
      showToast("Login successful! Redirecting...", "success");
      
      // Wait a bit before redirecting so user sees the toast
      setTimeout(() => {
        if (role === "customer") router.push("/customerdashboard");
        else if (role === "seller") router.push("/sellerdashboard");
        else if (role === "admin") router.push("/admin");
      }, 1500);
    } else {
      // Show error toast
      showToast(
        error || "Invalid credentials. Please try again.", 
        "error"
      );
    }
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="flex flex-col items-center ">
        <h2
          className={`text-2xl font-bold text-white text-center mb-1 w-70 ${alconica.className}`}
        >
          Welcome Back!
        </h2>
        <h2
          className={`text-2xl font-bold text-white text-center mb-10 w-90 ${alconica.className}`}
        >
          Login To Your Account
        </h2>
      </div>

      <form className="space-y-4 flex flex-col items-center">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-95 p-3 rounded-2xl bg-white/20 text-white placeholder-black  focus:outline-none focus:ring-1 focus:ring-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-95 p-3 rounded-2xl bg-white/20 text-white placeholder-black  focus:outline-none focus:ring-1 focus:ring-white"
        />

        <h6 className="text-black ml-61 mt-0.5">Forget Password?</h6>

        <button
          type="submit"
          onClick={handleSubmit}
          className="mt-4 w-40 py-2 rounded-4xl bg-[#004030] hover:bg-emerald-600 transition text-white font-semibold shadow-md"
        >
          {loading ? "Login..." : "Sign In"}
        </button>

        <div className="text-center mt-4">
          <span className="text-black">Don't have an account? </span>
          <Link href="/register" className="text-white font-semibold hover:text-emerald-300 transition">
            Sign up
          </Link>
        </div>

        <div className="flex items-center my-6 w-70">
          <div className="flex-grow h-px bg-black opacity-30"></div>
          <span className="px-4 text-black">OR</span>
          <div className="flex-grow h-px bg-black opacity-30"></div>
        </div>

        <button
          type="submit"
          className="mt-1 w-70 py-1.5 rounded-4xl bg-white hover:bg-emerald-600 transition text-black font-semibold shadow-md"
        >
          <svg
            className="w-5 h-5 inline-block mr-5 mb-1"
            viewBox="0 0 533.5 544.3"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.3H272v95h146.9c-6.4 34.7-25.5 64.1-54.5 83.9v69h88.1c51.5-47.5 81.9-117.5 81.9-197.6z"
              fill="#4285F4"
            />
            <path
              d="M272 544.3c73.5 0 135-24.4 180-66.4l-88.1-69c-24.4 16.3-55.6 25.8-91.9 25.8-70.7 0-130.7-47.7-152.2-111.6H28.4v70.4C73.3 488.2 167.1 544.3 272 544.3z"
              fill="#34A853"
            />
            <path
              d="M119.9 324.1c-8.2-24.4-8.2-50.6 0-75h-91.5v-70.4C6.2 205.3 0 239.3 0 272c0 32.7 6.2 66.7 28.4 93.3l91.5-41.2z"
              fill="#FBBC05"
            />
            <path
              d="M272 107.7c38.4 0 72.8 13.2 99.8 39.2l74.7-74.7C407 24.3 345.5 0 272 0 167.1 0 73.3 56.1 28.4 139.9l91.5 70.4c21.5-63.9 81.5-111.6 152.1-111.6z"
              fill="#EA4335"
            />
          </svg>{" "}
          Continue With Google
        </button>
      </form>
    </div>
  );
}