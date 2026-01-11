import { Card, CardContent } from "../../components/ui/card"
import { BarChart3Icon, CheckCircleIcon, Users2Icon, ShieldIcon, Lightbulb, Heart, Zap } from "lucide-react"
import { ArrowRightLeft, Lock, PieChart } from "lucide-react";
import Image from "next/image";
import geometricImage from "../../../public/geometric-blocks.jpg"
import jane from "../../../public/team-jane.jpg"
import jone from "../../../public/team-john.jpg"
import michael from "../../../public/team-michael.jpg"
import emily from "../../../public/team-emily.jpg"
import suleman from "../../../public/good2.jpg"

export const metadata = {
  title: "About PakPay",
  description: "Learn about PakPay mission to simplify and secure digital payments",
}


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">About PakPay</h1>
          <p className="text-lg text-emerald-700 max-w-2xl mx-auto text-pretty leading-relaxed">
            Our mission is to simplify and secure digital payments, making finance accessible and transparent for
            individuals and businesses alike.
          </p>
        </div>
      </section>

      {/* What PakPay Does Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What PakPay Does</h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              We provide a robust platform designed to meet all your payment needs with speed, security, and simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
            <Card className="border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-12 pb-8 px-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Seamless Transactions</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Execute payments instantly with our intuitive and streamlined transaction process.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-12 pb-8 px-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ironclad Security</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your data is protected with end-to-end encryption and industry-leading security protocols.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-12 pb-8 px-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <BarChart3Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Insights</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Gain a clear understanding of your finances with our powerful analytics and reporting tools.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Why We Built PakPay Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Why We Built PakPay</h2>
              <p className="text-gray-700 mb-5 leading-relaxed">
                Our story is one of passion, innovation, and a commitment to solving real-world financial challenges. We
                saw a need for a simpler, more transparent way to manage money and decided to build the solution
                ourselves.
              </p>
              <p className="text-gray-700 leading-relaxed">
                In today's fast-paced digital world, managing finances should be straightforward, not a chore. We were
                frustrated by the complexity and hidden fees of traditional banking systems. That's why we founded
                PakPay: to create a fintech platform that puts people first. Our vision is to empower users by giving
                them the tools they need to take control of their financial future, all within a single, secure, and
                easy-to-use application. We believe in transparency, fairness, and building technology that truly makes
                a difference in people's lives.
              </p>
            </div>

            {/* Right Column - Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-3xl overflow-hidden">
                <Image src={geometricImage} alt="abstract" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              We are a passionate team of innovators, thinkers, and builders dedicated to revolutionizing the world of
              finance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 justify-items-center">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-4 border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <Image src={jane} alt="Suleman" className="rounded-full " />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Jane Doe</h3>
              <p className="text-emerald-700 text-sm">Chief Executive Officer</p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-4 border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <Image src={jone} alt="John Smith" className="rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">John Smith</h3>
              <p className="text-emerald-700 text-sm">Chief Technology Officer</p>
            </div>

            {/* Team Member 3 */}
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-4 border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <Image src={emily} alt="Emily White" className="rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Emily White</h3>
              <p className="text-emerald-700 text-sm">Head of Product</p>
            </div>

            {/* Team Member 4 */}
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-4 border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <Image src={michael} alt="Michael Brown" className="rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Michael Brown</h3>
              <p className="text-emerald-700 text-sm">Lead Engineer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              The principles that guide our work and define who we are as a company.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Integrity */}
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We uphold the highest standards of honesty and transparency in all our actions.
              </p>
            </div>

            {/* Innovation */}
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We constantly seek out new and better ways to serve our customers.
              </p>
            </div>

            {/* Customer-Centricity */}
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Users2Icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer-Centricity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Customer success is at the heart of everything we do. Their success is our success.
              </p>
            </div>

            {/* Security */}
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We are committed to building the most secure platform to protect our users' data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-600">© 2026 PakPay. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-emerald-700 hover:text-emerald-900 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-emerald-700 hover:text-emerald-900 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer> */}
    </main>
  )
}
