import { Aclonica } from "next/font/google";
import { lora } from "@/app/libs/fonts";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";

const alconica = Aclonica({
  variable: "--font-alconica",
  subsets: ["latin"],
  weight: ["400"],
});

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Main Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="top-0 left-0 right-0 z-50 bg-[#437057]/80 backdrop-blur-lg"
      >
        <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white blur-lg opacity-20 rounded-full"></div>
                <div className="relative bg-white/90 w-9 h-9 rounded-full flex items-center justify-center shadow-md">
                  <span className={`${alconica.className} text-[#437057] text-lg font-bold`}>L</span>
                </div>
              </div>
              <div className={`${alconica.className} text-white text-xl font-bold tracking-tight drop-shadow-md`}>
                Leftly
                <span className="text-white/80">.</span>
              </div>
            </motion.div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              {[
                { name: "Home",path:"/", active: true },
                { name: "Restaurants", path:"/homepage"},
                { name: "How It Works",path:"/howitworks" },
                { name: "About Us",path:"/aboutus" },
                { name: "Contact",path:"/contactus" },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -2 }}
                  className="relative"
                >
                  <Link
                    href={item.path || "#"}
                    className={`flex items-center py-2 transition-all duration-300 ${
                      item.active
                        ? "text-white font-semibold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <span className={`${lora.className} font-medium text-sm`}>
                      {item.name}
                    </span>
                    {item.active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"></span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <button className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-white text-[#437057] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </button>
              </motion.div>

              {/* Sign In Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block"
              >
                {/* <Link href="/login">
                  <button className={`${lora.className} px-5 py-2.5 rounded-lg font-semibold 
                    bg-white text-[#437057] hover:bg-white/90
                    shadow-sm hover:shadow transition-all duration-300 text-sm`}>
                    Sign In
                  </button>
                </Link> */}
              </motion.div>

              {/* Become a Partner Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden lg:block"
              >
                <Link href="/login">
                  <button className={`${lora.className} px-5 py-2.5 rounded-lg font-semibold
                    border-2 border-white text-white hover:bg-white hover:text-[#437057]
                    transition-all duration-300 text-sm`}>
                    Get Started With Us
                  </button>
                </Link>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={isMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          className="lg:hidden overflow-hidden bg-[#437057]/95 backdrop-blur-lg border-t border-white/10"
        >
          <div className="px-6 py-4 space-y-4">
            {["Home", "Restaurants", "How It Works", "About Us", "Contact"].map((item) => (
              <Link
                key={item}
                href="#"
                className="block px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className={`${lora.className} font-medium`}>{item}</span>
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-white/10">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className={`${lora.className} block px-4 py-3 rounded-lg font-semibold text-center
                  bg-white text-[#437057] hover:bg-white/90 transition-colors duration-300`}
              >
                Sign In
              </Link>
              <Link
                href="/partner"
                onClick={() => setIsMenuOpen(false)}
                className={`${lora.className} block px-4 py-3 rounded-lg font-semibold text-center
                  border-2 border-white text-white hover:bg-white hover:text-[#437057]
                  transition-colors duration-300`}
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}