"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  // MOCK DATA (later from DB)
  const totalLoanGiven = 250000;
  const totalCollected = 120000;
  const pendingLoan = totalLoanGiven - totalCollected;
  const activeCustomers = 12;
  const profit = 45000;

  const recentTransactions = [
    { id: 1, name: "Kamal Perera", amount: 5000, date: "2026-01-01" },
    { id: 2, name: "Nimal Silva", amount: 10000, date: "2026-01-03" },
    { id: 3, name: "Saman Kumara", amount: 7000, date: "2026-01-05" },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Loan analytics overview
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        <Card>
          <CardHeader>
            <CardTitle>Total Loan Given</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            Rs. {totalLoanGiven.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-600">
            Rs. {totalCollected.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Loan</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-red-600">
            Rs. {pendingLoan.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Customers</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {activeCustomers}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-blue-600">
            Rs. {profit.toLocaleString()}
          </CardContent>
        </Card>

      </div>

      {/* AI INSIGHTS */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p>📊 Repayment trend: Stable (last 30 days)</p>
          <p>⚠️ Risk prediction: 2 customers may delay payments</p>
          <p>📈 Revenue trend: Increasing by 12%</p>
        </CardContent>
      </Card>

      {/* RECENT TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>

        <CardContent>

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recentTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    Rs. {t.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>

        </CardContent>
      </Card>

    </div>
  );
}