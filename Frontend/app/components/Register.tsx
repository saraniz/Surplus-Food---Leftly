"use client";

import { alconica } from "../libs/fonts";
import { useState } from "react";
import { useCusAuthStore } from "../ZustandStore/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define the props interface
interface RegisterProps {
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function Register({ onShowToast }: RegisterProps) {
  const [userType, setUserType] = useState<"customer" | "seller">("customer");
  const router = useRouter();

  const [cusName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [sellerPassword, setSellerPassword] = useState("");
  const [sellerConfirmPassword, setSellerConfirmPassword] = useState("");

  const { register, sellerRegister, loading, error } = useCusAuthStore();
  
  // Form validation states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate password strength
  const isStrongPassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const validateCustomerForm = () => {
    const errors: Record<string, string> = {};

    if (!cusName.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(email)) errors.email = "Please enter a valid email";
    if (!location.trim()) errors.location = "Location is required";
    if (!password) errors.password = "Password is required";
    else if (!isStrongPassword(password).isValid) errors.password = "Password is not strong enough";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

    return errors;
  };

  const validateSellerForm = () => {
    const errors: Record<string, string> = {};

    if (!businessName.trim()) errors.businessName = "Business name is required";
    if (!businessEmail.trim()) errors.businessEmail = "Business email is required";
    else if (!isValidEmail(businessEmail)) errors.businessEmail = "Please enter a valid email";
    if (!businessAddress.trim()) errors.businessAddress = "Business address is required";
    if (!sellerPassword) errors.sellerPassword = "Password is required";
    else if (!isStrongPassword(sellerPassword).isValid) errors.sellerPassword = "Password is not strong enough";
    if (!sellerConfirmPassword) errors.sellerConfirmPassword = "Please confirm your password";
    else if (sellerPassword !== sellerConfirmPassword) errors.sellerConfirmPassword = "Passwords do not match";

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});

    // Validate form based on user type
    const errors = userType === "customer" 
      ? validateCustomerForm() 
      : validateSellerForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (onShowToast) {
        onShowToast("Please fill all required fields correctly", "error");
      }
      return;
    }

    try {
      if (userType === "customer") {
        await register(cusName, email, location, password);
        
        // Show success toast
        if (onShowToast) {
          onShowToast("Account created successfully! Redirecting...", "success");
        }
        
        // Wait a bit before redirecting
        setTimeout(() => {
          router.push("/customerdashboard");
        }, 1500);
      } 
      
      if (userType === "seller") {
        await sellerRegister(businessName, businessEmail, businessAddress, sellerPassword);
        
        // Show success toast
        if (onShowToast) {
          onShowToast("Seller account created successfully! Redirecting...", "success");
        }
        
        // Wait a bit before redirecting
        setTimeout(() => {
          router.push("/sellerdashboard");
        }, 1500);
      }
    } catch (err: any) {
      // Show error toast from the store's error
      if (onShowToast) {
        onShowToast(
          error || "Registration failed. Please try again.", 
          "error"
        );
      }
    }
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl relative">
      <div className="flex flex-col items-center">
        <h2
          className={`text-2xl font-bold text-white text-center mb-1 w-70 ${alconica.className}`}
        >
          Welcome!
        </h2>
        <h2
          className={`text-2xl font-bold text-white text-center mb-6 w-90 ${alconica.className}`}
        >
          Create An Account
        </h2>
      </div>

      {/* User Type Selection */}
      <div className="flex justify-center mb-8 gap-6">
        <label className="flex gap-2 items-center cursor-pointer group">
          <input
            type="radio"
            value="customer"
            checked={userType === "customer"}
            onChange={() => setUserType("customer")}
            className="text-emerald-500 focus:ring-emerald-400"
          />
          <span className={`text-white group-hover:text-emerald-300 transition-colors ${userType === "customer" ? "font-semibold" : ""}`}>
            Customer
          </span>
        </label>

        <label className="flex gap-2 items-center cursor-pointer group">
          <input
            type="radio"
            value="seller"
            checked={userType === "seller"}
            onChange={() => setUserType("seller")}
            className="text-emerald-500 focus:ring-emerald-400"
          />
          <span className={`text-white group-hover:text-emerald-300 transition-colors ${userType === "seller" ? "font-semibold" : ""}`}>
            Seller
          </span>
        </label>
      </div>

      {/* Already have an account? Sign in - Added here */}
      <div className="text-center mb-6">
        <span className="text-white/70">Already have an account? </span>
        <Link href="/login" className="text-emerald-300 font-semibold hover:text-emerald-200 hover:underline transition-colors">
          Sign in
        </Link>
      </div>

      {/* Customer Registration Form */}
      {userType === "customer" && (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
          <div className="flex gap-4 w-95">
            <div className="flex-1">
              <input
                type="text"
                value={cusName}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }));
                }}
                placeholder="Full Name"
                required
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.name ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.name && (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.name}</p>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (formErrors.location) setFormErrors(prev => ({ ...prev, location: "" }));
                }}
                required
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.location ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.location && (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.location}</p>
              )}
            </div>
          </div>

          <div className="w-95">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" }));
              }}
              required
              className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                formErrors.email ? "ring-2 ring-rose-400" : ""
              }`}
            />
            {formErrors.email ? (
              <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.email}</p>
            ) : email && !isValidEmail(email) && (
              <p className="text-rose-300 text-xs mt-1 ml-2">Please enter a valid email</p>
            )}
          </div>

          <div className="flex gap-4 w-95">
            <div className="flex-1">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: "" }));
                }}
                required
                minLength={8}
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.password ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.password ? (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.password}</p>
              ) : password && (
                <div className="text-xs mt-1 ml-2 space-y-1">
                  <p className={isStrongPassword(password).requirements.minLength ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least 8 characters
                  </p>
                  <p className={isStrongPassword(password).requirements.hasUpperCase ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one uppercase letter
                  </p>
                  <p className={isStrongPassword(password).requirements.hasLowerCase ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one lowercase letter
                  </p>
                  <p className={isStrongPassword(password).requirements.hasNumbers ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one number
                  </p>
                  <p className={isStrongPassword(password).requirements.hasSpecialChar ? "text-emerald-300" : "text-amber-300"}>
                    ✗ Special character (optional)
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
                }}
                required
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.confirmPassword ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.confirmPassword ? (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.confirmPassword}</p>
              ) : confirmPassword && password !== confirmPassword && (
                <p className="text-rose-300 text-xs mt-1 ml-2">Passwords don't match</p>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Seller Registration Form */}
      {userType === "seller" && (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
          <div className="w-95">
            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (formErrors.businessName) setFormErrors(prev => ({ ...prev, businessName: "" }));
              }}
              required
              className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                formErrors.businessName ? "ring-2 ring-rose-400" : ""
              }`}
            />
            {formErrors.businessName && (
              <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.businessName}</p>
            )}
          </div>

          <div className="w-95">
            <input
              type="text"
              placeholder="Business Address"
              value={businessAddress}
              onChange={(e) => {
                setBusinessAddress(e.target.value);
                if (formErrors.businessAddress) setFormErrors(prev => ({ ...prev, businessAddress: "" }));
              }}
              required
              className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                formErrors.businessAddress ? "ring-2 ring-rose-400" : ""
              }`}
            />
            {formErrors.businessAddress && (
              <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.businessAddress}</p>
            )}
          </div>

          <div className="w-95">
            <input
              type="email"
              placeholder="Business Email"
              value={businessEmail}
              onChange={(e) => {
                setBusinessEmail(e.target.value);
                if (formErrors.businessEmail) setFormErrors(prev => ({ ...prev, businessEmail: "" }));
              }}
              required
              className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                formErrors.businessEmail ? "ring-2 ring-rose-400" : ""
              }`}
            />
            {formErrors.businessEmail ? (
              <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.businessEmail}</p>
            ) : businessEmail && !isValidEmail(businessEmail) && (
              <p className="text-rose-300 text-xs mt-1 ml-2">Please enter a valid email</p>
            )}
          </div>

          <div className="flex gap-4 w-95">
            <div className="flex-1">
              <input
                type="password"
                placeholder="Password"
                value={sellerPassword}
                onChange={(e) => {
                  setSellerPassword(e.target.value);
                  if (formErrors.sellerPassword) setFormErrors(prev => ({ ...prev, sellerPassword: "" }));
                }}
                required
                minLength={8}
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.sellerPassword ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.sellerPassword ? (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.sellerPassword}</p>
              ) : sellerPassword && (
                <div className="text-xs mt-1 ml-2 space-y-1">
                  <p className={isStrongPassword(sellerPassword).requirements.minLength ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least 8 characters
                  </p>
                  <p className={isStrongPassword(sellerPassword).requirements.hasUpperCase ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one uppercase letter
                  </p>
                  <p className={isStrongPassword(sellerPassword).requirements.hasLowerCase ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one lowercase letter
                  </p>
                  <p className={isStrongPassword(sellerPassword).requirements.hasNumbers ? "text-emerald-300" : "text-amber-300"}>
                    ✓ At least one number
                  </p>
                  <p className={isStrongPassword(sellerPassword).requirements.hasSpecialChar ? "text-emerald-300" : "text-amber-300"}>
                    ✗ Special character (optional)
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="password"
                placeholder="Confirm Password"
                value={sellerConfirmPassword}
                onChange={(e) => {
                  setSellerConfirmPassword(e.target.value);
                  if (formErrors.sellerConfirmPassword) setFormErrors(prev => ({ ...prev, sellerConfirmPassword: "" }));
                }}
                required
                className={`w-full p-3 rounded-2xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/30 transition-all ${
                  formErrors.sellerConfirmPassword ? "ring-2 ring-rose-400" : ""
                }`}
              />
              {formErrors.sellerConfirmPassword ? (
                <p className="text-rose-300 text-xs mt-1 ml-2">{formErrors.sellerConfirmPassword}</p>
              ) : sellerConfirmPassword && sellerPassword !== sellerConfirmPassword && (
                <p className="text-rose-300 text-xs mt-1 ml-2">Passwords don't match</p>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Submit Button and Google Sign Up */}
      <div className="space-y-4 flex flex-col items-center mt-8">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className={`
            mt-2 w-40 py-3 rounded-4xl font-semibold shadow-lg
            transition-all duration-300
            ${loading 
              ? "bg-emerald-800 cursor-not-allowed" 
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl"
            }
            text-white flex items-center justify-center
          `}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Registering...
            </>
          ) : (
            "Sign Up"
          )}
        </button>

        <div className="flex items-center my-6 w-70">
          <div className="flex-grow h-px bg-white/30"></div>
          <span className="px-4 text-white/70 text-sm">OR</span>
          <div className="flex-grow h-px bg-white/30"></div>
        </div>

        <button
          type="button"
          className="w-70 py-3 rounded-4xl bg-white/10 hover:bg-white/20 backdrop-blur-sm 
                   transition-all text-white font-semibold border border-white/20 
                   hover:border-white/30 flex items-center justify-center gap-3"
        >
          <svg
            className="w-5 h-5"
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
          </svg>
          Sign Up With Google
        </button>
      </div>
    </div>
  );
}