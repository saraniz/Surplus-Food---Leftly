import { Aclonica } from "next/font/google";
import { lora } from "@/app/libs/fonts";

const alconica = Aclonica({
  variable: "--font-alconica",
  subsets: ["latin"], //only load latin characters
  weight: ["400"], //alconica only has one weight..so we have to specify it to identify next.js to load it
});

export default function Navbar() {
  return (
    <main className={`flex mt-10 `}>
      <section className={`${alconica.className}`}>
        <h2 className="text-black ml-[70px]  ">Leftly</h2>
      </section>

      <section
        className={`flex ml-[990px] text-black gap-9 ${lora.className}`}
      >
        <h2 className="mt-0.5">Home</h2>
        <h2 className="mt-0.5">Contact</h2>
        <h2 className="mt-0.5">About</h2>
        <button className="flex border border-black px-4 py-0.5 rounded-2xl hover:bg-black hover:text-white transition">
          Sign Up
        </button>
      </section>
    </main>
  );
}
