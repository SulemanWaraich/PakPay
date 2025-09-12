import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ChevronDown, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

const transactions = [
  {
    id: 1,
    type: "Withdrew USDC",
    date: "Feb 19, 2024",
    time: "03:18",
    amount: "-5,059.9477",
    currency: "USDC",
    usdValue: "-$5,060.36",
    isPositive: false
  },
  {
    id: 2,
    type: "Converted to USDC",
    date: "Feb 19, 2024", 
    time: "03:17",
    amount: "+5,059.9477",
    currency: "USDC",
    usdValue: "-704.0000 DYM",
    isPositive: true
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-3xl font-semibold text-purple-600 mb-8">Transactions</h1>
        
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-fit grid-cols-2 mb-8">
            <TabsTrigger value="history" className="px-6">History</TabsTrigger>
            <TabsTrigger value="scheduled" className="px-6">Scheduled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-6">Transactions History</h2>
              
              {/* Transaction Filters */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Assets" />
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      <SelectItem value="usdc">USDC</SelectItem>
                      <SelectItem value="btc">BTC</SelectItem>
                      <SelectItem value="eth">ETH</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Types" />
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="trade">Trade</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Start date" />
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="End date" />
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" className="text-muted-foreground">
                    Clear
                  </Button>
                </div>

                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Transactions List */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center bg-purple-600">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center  bg-purple-600">
                            <span className="text-primary-foreground text-xs font-bold ">$</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-foreground">{transaction.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.date}, {transaction.time}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={cn(
                          "font-medium",
                          transaction.isPositive ? "text-success" : "text-foreground"
                        )}>
                          {transaction.isPositive ? '+' : ''}{transaction.amount} {transaction.currency}
                        </div>
                        {transaction.usdValue && (
                          <div className="text-sm text-muted-foreground">
                            {transaction.usdValue}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-6">Scheduled Transactions</h2>
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <p className="text-muted-foreground">No scheduled transactions found</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
