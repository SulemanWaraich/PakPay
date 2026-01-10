import "./globals.css";
import "@repo/ui";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { AppbarClient } from "../components/AppbarClient";
import Script from "next/script";
import AnalyticsProvider from "../components/AnalyticsProvider"; // we'll create this below
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { Footer2 } from "../components/Footer2";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PakPay",
  description: "Secure payment platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-V1ZQ52KQRS"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V1ZQ52KQRS', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* <AppbarClient /> */}
          {/* Track route changes */}
            <Suspense fallback={null}> 
               <AnalyticsProvider />   
            </Suspense>
            <Navbar />
          {children}
          <Footer2 />
        </Providers>

           {/* ✅ Toast Container (globally accessible) */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </body>
    </html>
  );
}
