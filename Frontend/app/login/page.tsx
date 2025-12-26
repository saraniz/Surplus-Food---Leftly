// app/login/page.tsx
// import { LoginForm } from "@/components/login-form"

import Login from "../components/Login";

export default function LoginPage() {




  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#004030] via-[#1B3A2C] to-[#2E5A3F]
 relative overflow-hidden"
    >
      {/* Floating organic shapes */}
      <div className="absolute inset-0">
        {/* Soft glowing circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-r from-lime-400/15 to-green-400/15 rounded-full blur-2xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-[pulse_7s_ease-in-out_infinite]" />

        {/* Removed square shape */}
        {/* <div className="absolute top-60 left-1/3 w-32 h-32 bg-gradient-to-r from-emerald-400/30 to-green-400/30 rounded-2xl rotate-45 animate-[bounce_5s_infinite]" /> */}

        {/* Medium floating shapes */}
        <div className="absolute bottom-60 right-1/4 w-24 h-24 bg-gradient-to-r from-lime-400/40 to-emerald-400/40 rounded-full animate-[bounce_6s_infinite]" />
        <div className="absolute top-1/3 right-20 w-20 h-20 bg-gradient-to-r from-teal-400/35 to-green-400/35 rounded-lg rotate-12 animate-[bounce_7s_infinite]" />

        {/* Small floating elements */}
        {/* <div className="absolute top-32 left-1/2 w-12 h-12 bg-gradient-to-r from-lime-400/50 to-green-400/50 rounded-full animate-[ping_4s_infinite]" />
        <div className="absolute bottom-40 left-1/4 w-16 h-16 bg-gradient-to-r from-emerald-400/40 to-teal-400/40 rounded-xl rotate-45 animate-[ping_5s_infinite]" />
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-gradient-to-r from-green-400/60 to-emerald-400/60 rounded-full animate-[ping_6s_infinite]" /> */}

        {/* Floating lines/bars */}
        <div className="absolute top-1/4 right-1/3 w-40 h-2 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent rounded-full rotate-12 animate-[pulse_7s_infinite]" />
        <div className="absolute bottom-1/3 left-1/3 w-32 h-1 bg-gradient-to-r from-transparent via-green-400/40 to-transparent rounded-full -rotate-12 animate-[pulse_8s_infinite]" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Login Form */}
          <div className="flex items-center justify-center">
            <Login />
          </div>

          {/* Right side - Enlarged image */}
          <div className="hidden lg:flex items-center justify-center relative ">
            <div className="relative  max-w-2xl ">
              {" "}
              {/* increased size */}
              <img
                className="w-full h-auto object-cover transform scale-110"
                src="/ls.png"
                alt="food image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
