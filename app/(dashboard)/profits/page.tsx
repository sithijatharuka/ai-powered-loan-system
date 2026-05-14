"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProfitFilter = "today" | "last7days" | "custom" | "monthly";

type ProfitRow = {
  customerId: number;
  customerName: string;
  paymentAmount: number;
  interestRate: number;
  profit: number;
  date: string;
};

type ProfitApiResponse = {
  rows: ProfitRow[];
  totalProfit: number;
  totalPayments: number;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function Profits() {
  const [filter, setFilter] = useState<ProfitFilter>("today");
  const [customStartDate, setCustomStartDate] = useState(toDateInputValue(new Date()));
  const [customEndDate, setCustomEndDate] = useState(toDateInputValue(new Date()));
  const [month, setMonth] = useState(toMonthInputValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfitApiResponse>({
    rows: [],
    totalProfit: 0,
    totalPayments: 0,
  });

  const filterLabel = useMemo(() => {
    if (filter === "today") return "Today";
    if (filter === "last7days") return "Last 7 Days";
    if (filter === "custom") return "Custom Date Range";
    return "Monthly";
  }, [filter]);

  const formatCurrency = (amount: number) => {
    const roundedAmount = Number(amount.toFixed(2));
    return `Rs. ${roundedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    async function loadProfits() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ filter });

        if (filter === "custom") {
          params.set("startDate", customStartDate);
          params.set("endDate", customEndDate);
        }

        if (filter === "monthly") {
          params.set("month", month);
        }

        const response = await fetch(`/api/dashboard/profits?${params.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setData({ rows: [], totalProfit: 0, totalPayments: 0 });
          setError(result?.message ?? "Failed to load profits");
          return;
        }

        setData(result.data as ProfitApiResponse);
      } catch {
        setData({ rows: [], totalProfit: 0, totalPayments: 0 });
        setError("Failed to load profits");
      } finally {
        setLoading(false);
      }
    }

    void loadProfits();
  }, [filter, customStartDate, customEndDate, month]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Profit table from loan-interest collections with dynamic date filters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="space-y-1">
              <div className="text-sm font-medium">Range Type</div>
              <Select value={filter} onValueChange={(value) => setFilter(value as ProfitFilter)}>
                <SelectTrigger className="w-55">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                  <SelectItem value="monthly">Monthly Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filter === "custom" ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Start Date</div>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-47.5"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">End Date</div>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-47.5"
                  />
                </div>
              </>
            ) : null}

            {filter === "monthly" ? (
              <div className="space-y-1">
                <div className="text-sm font-medium">Month</div>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-47.5"
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Payments ({filterLabel})</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-600">
            {formatCurrency(data.totalPayments)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Profit ({filterLabel})</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-blue-600">
            {formatCurrency(data.totalProfit)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit Table</CardTitle>
        </CardHeader>

        <CardContent>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Loading profits...
                  </TableCell>
                </TableRow>
              ) : data.rows.length > 0 ? (
                data.rows.map((row) => (
                  <TableRow key={`${row.customerId}-${row.date}-${row.paymentAmount}`}>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {row.customerId} - {row.customerName}
                    </TableCell>
                    <TableCell>{row.interestRate}%</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(row.paymentAmount)}
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">
                      {formatCurrency(row.profit)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No profit records for this filter
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
