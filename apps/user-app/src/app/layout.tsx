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
import { NotificationProvider } from "../components/NotificationProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";

// Get session on the server side for notifications


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PakPay",
  description: "Secure payment platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

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
            <NotificationProvider userId={session?.user?.id} merchantId={session?.user?.role === "MERCHANT" ? session?.user?.merchantId : undefined} >
          {children}
          </NotificationProvider>
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
