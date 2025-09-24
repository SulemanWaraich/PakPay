import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { Button } from "../components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="flex items-center justify-between px-6 py-4 bg-white">
        <div className="text-3xl font-bold text-green-600">PakPay</div>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/api/auth/signin"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <span className="text-green-600 font-bold">+</span>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header> */}

      {/* Main Content */}
      <main className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-green-100 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <h1 className="sm:text-6xl text-4xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Fast, safe
                  <br />
                  social
                  <br />
                  payments
                </h1>

                <p className="sm:text-xl text-lg text-gray-700 leading-relaxed max-w-md ">
                  Pay, get paid, grow a business, and more. Join the millions of
                  people on PakPay.
                </p>

                {session?.user ? (
                  <Link href="/dashboard">
                    <Button className="bg-green-600 hover:bg-green-700 text-white sm:px-8 sm:py-6 px-4 py-3  sm:text-lg text-base rounded-full font-semibold flex items-center gap-3 shadow-lg mt-3">
                      <span className="bg-white text-green-600 sm:w-8 sm:h-8 w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        →
                      </span>
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/api/auth/signin">
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full font-semibold flex items-center gap-3 shadow-lg">
                      <span className="bg-white text-green-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        V
                      </span>
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>

              {/* Right Content - Image with Payment Notification */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
                    alt="Three friends taking a selfie outdoors"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Payment Notification Overlay */}
                <div className="absolute bottom-4 right-4 bg-white rounded-2xl sm:p-4 p-2 shadow-xl border border-gray-100 max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100">
                      <Image
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
                        alt="Picnic scene"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        You paid Trish A
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        Picnic in the park 🧺
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
