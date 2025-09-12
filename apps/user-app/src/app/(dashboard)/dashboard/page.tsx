import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Percent, Plus, Minus, ArrowUpDown, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react"

export default function KrakenDashboard() {
  return (
    <div className="flex w-screen">
      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl">
          {/* Greeting */}
          <h1 className="text-3xl font-semibold text-purple-600 mb-8">Good afternoon, Harkirat</h1>

          {/* Portfolio Section */}
          <div className="mb-8">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Portfolio value</p>
              <p className="text-4xl font-bold text-gray-900">$0.00</p>
            </div>

            {/* Chart Area */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="relative h-64 mb-4">
                  {/* Simple flat line chart representation */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-purple-300"></div>
                  </div>
                  <div className="absolute top-0 left-0 text-xs text-gray-500">$0.00</div>
                  <div className="absolute bottom-0 right-0 text-xs text-gray-500">$0.00</div>
                </div>

                {/* Date labels */}
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>20 FEB</span>
                  <span>28 FEB</span>
                  <span>7 MAR</span>
                  <span>15 MAR</span>
                  <span>23 MAR</span>
                </div>

                {/* Time period buttons */}
                <div className="flex justify-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    1W
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    1M
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    3M
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    6M
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    1Y
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs font-semibold">
                    ALL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-8">
              <div className="flex flex-col items-center">
                <Button size="lg" className="w-12 h-12 rounded-full bg-black hover:bg-purple-700 mb-2">
                  <Plus className="h-6 w-6" />
                </Button>
                <span className="text-sm text-gray-700">Buy</span>
              </div>
              <div className="flex flex-col items-center">
                <Button size="lg" className="w-12 h-12 rounded-full bg-black hover:bg-purple-700 mb-2">
                  <Minus className="h-6 w-6" />
                </Button>
                <span className="text-sm text-gray-700">Sell</span>
              </div>
              <div className="flex flex-col items-center">
                <Button size="lg" className="w-12 h-12 rounded-full bg-black hover:bg-purple-700 mb-2">
                  <ArrowUpDown className="h-6 w-6" />
                </Button>
                <span className="text-sm text-gray-700">Convert</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-12 h-12 rounded-full border-gray-300 mb-2 bg-transparent"
                >
                  <Download className="h-6 w-6 text-gray-600" />
                </Button>
                <span className="text-sm text-gray-700">Deposit</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-12 h-12 rounded-full border-gray-300 mb-2 bg-transparent"
                >
                  <Upload className="h-6 w-6 text-gray-600" />
                </Button>
                <span className="text-sm text-gray-700">Withdraw</span>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Percent className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Earn up to 10%+ APR</span>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">New</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Set up recurring buys</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Schedule regular crypto purchases to balance market fluctuations.
                </p>
                <Button className="bg-black text-white hover:bg-purple-700">Get started</Button>
              </div>
            </div>

            {/* Illustration placeholder */}
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-24 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-16 h-16 bg-purple-200 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-400 rounded"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <ChevronLeft className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </aside>
      
    </div>
  )
}
