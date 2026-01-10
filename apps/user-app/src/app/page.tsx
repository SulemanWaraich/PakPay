import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { Button } from "../components/ui/button";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import WhyChoose from "../components/WhyChoose";
import HowItWorks from "../components/HowItWorks";
import {Footer} from "../components/Footer";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <main>
        <Hero />
        <Features />
        <WhyChoose />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}


              

