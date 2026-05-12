"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardSummary = {
  totalLoanGiven: number;
  totalCollected: number;
  pendingLoan: number;
  activeCustomers: number;
  profitFromLoanInterest: number;
  monthlyProfit?: number;
  monthName?: string;
  recentTransactions: Array<{
    customerId: number;
    customerName: string;
    amount: number;
    date: string;
    note?: string;
  }>;
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);

      try {
        const response = await fetch("/api/dashboard/summary");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setSummary(null);
          return;
        }

        setSummary(data.summary as DashboardSummary);
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const totalLoanGiven = summary?.totalLoanGiven ?? 0;
  const totalCollected = summary?.totalCollected ?? 0;
  const pendingLoan = summary?.pendingLoan ?? 0;
  const activeCustomers = summary?.activeCustomers ?? 0;
  const profitFromLoanInterest = summary?.profitFromLoanInterest ?? 0;
  const monthlyProfit = summary?.monthlyProfit ?? 0;
  const monthName =
    summary?.monthName ??
    new Date().toLocaleString(undefined, { month: "long", year: "numeric" });
  const recentTransactions = summary?.recentTransactions ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live loan portfolio overview from MongoDB
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Loan Amount Given</CardTitle>
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
            {loading ? "Loading..." : activeCustomers}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit from Loan Interest</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-blue-600">
            Rs. {profitFromLoanInterest.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit — {monthName}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-indigo-600">
            Rs. {monthlyProfit.toLocaleString()}
          </CardContent>
        </Card>
      </div>

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
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <TableRow key={`${t.customerId}-${t.date}-${t.amount}`}>
                    <TableCell>
                      #{t.customerId} • {t.customerName}
                    </TableCell>
                    <TableCell>
                      {new Date(t.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      Rs. {t.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-zinc-500"
                  >
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
