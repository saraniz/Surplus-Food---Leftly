import { Aclonica, Geist, Geist_Mono,Lora } from "next/font/google";

// Navbar font
export const alconica = Aclonica({
  variable: "--font-alconica",
  subsets: ["latin"],
  weight: ["400"],
});

// Global fonts
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const lora = Lora({
  variable: "--font-lora",  
  subsets: ["latin"],
})


