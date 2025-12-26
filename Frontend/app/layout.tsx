import type { Metadata } from "next";
import "./globals.css";
import { alconica,geistMono,geistSans,lora } from "@/app/libs/fonts"
import "leaflet/dist/leaflet.css";
import Toast from "./components/toast";



//refer notion to understand the layout and page structure of next.js
 //children is the content of the page..it wrap all of our pages
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${alconica.variable} ${lora.variable} antialiased`} //antialiased makes the font smoother(technique)
      >
        {children}
        <Toast />
      </body>
    </html>
  );
}
