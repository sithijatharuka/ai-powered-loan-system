"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LoanHistoryRow = {
  loanAmount: number;
  interestRate: number;
  duration: number;
  totalWithInterest: number;
  monthlyPayment: number;
  dailyPayment: number;
  paidAmount: number;
  transactions: Array<{ amount: number; date: string | Date; note?: string }>;
  status?: "ongoing" | "completed";
  openedAt?: string | Date;
  closedAt?: string | Date;
};

type CustomerLoan = {
  id: number;
  name: string;
  mongoId?: string;
  loanAmount: number;
  interestRate: number;
  duration: number;
  totalWithInterest: number;
  paidAmount: number;
  loanHistory?: LoanHistoryRow[];
  openedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export default function Loans() {
  const [loans, setLoans] = useState<Array<CustomerLoan & {
    loanId: string;
    openedAt?: string | Date;
    closedAt?: string | Date;
    status: "ongoing" | "completed";
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format loan ID as L01, L02, etc.
  const formatLoanId = (id: number, recordIndex: number): string =>
    `L${String(id).padStart(2, "0")}-${String(recordIndex + 1).padStart(2, "0")}`;

  useEffect(() => {
    async function loadLoans() {
      setLoading(true);

      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setLoans([]);
          return;
        }

        const flattenedLoans = (data.customers ?? []).flatMap(
          (customer: CustomerLoan) => {
            const currentTotal = Number(customer.totalWithInterest || 0);
            const currentPaid = Number(customer.paidAmount || 0);
            const currentRemaining = Math.max(currentTotal - currentPaid, 0);
            const currentStatus: "ongoing" | "completed" =
              currentRemaining > 0 ? "ongoing" : "completed";

            const currentLoan = {
              ...customer,
              loanId: formatLoanId(customer.id, 0),
              status: currentStatus,
              openedAt: customer.openedAt ?? customer.createdAt,
              closedAt:
                currentStatus === "completed" ? customer.updatedAt : undefined,
            };

            const historyLoans = (customer.loanHistory ?? []).map(
              (loan, recordIndex) => {
                const historyRemaining = Math.max(
                  Number(loan.totalWithInterest || 0) - Number(loan.paidAmount || 0),
                  0,
                );

                return {
                  ...customer,
                  loanAmount: loan.loanAmount,
                  interestRate: loan.interestRate,
                  duration: loan.duration,
                  totalWithInterest: loan.totalWithInterest,
                  paidAmount: loan.paidAmount,
                  loanId: formatLoanId(customer.id, recordIndex + 1),
                  status:
                    loan.status ?? (historyRemaining > 0 ? "ongoing" : "completed"),
                  openedAt: loan.openedAt,
                  closedAt: loan.closedAt,
                };
              },
            );

            return [currentLoan, ...historyLoans];
          },
        );

        setLoans(flattenedLoans);
      } finally {
        setLoading(false);
      }
    }

    void loadLoans();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Loans</h1>

        <p className="text-sm text-muted-foreground">
          Individual customer loan details
        </p>
      </div>

      {/* TABLE CARD */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Loan Records</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="border rounded-xl overflow-hidden">
            <Table>
              {/* TABLE HEADER */}
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>Loan ID</TableHead>

                  <TableHead>Customer Name</TableHead>

                  <TableHead>Customer ID</TableHead>

                  <TableHead>Loan Amount</TableHead>

                  <TableHead>Interest</TableHead>

                  <TableHead>Duration</TableHead>

                  <TableHead>Total Payable</TableHead>

                  <TableHead>Remaining</TableHead>

                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              {/* TABLE BODY */}
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-zinc-500"
                    >
                      Loading loans...
                    </TableCell>
                  </TableRow>
                ) : loans.length > 0 ? (
                  loans
                    .sort((a, b) => {
                      const aTime = new Date(a.openedAt ?? 0).getTime();
                      const bTime = new Date(b.openedAt ?? 0).getTime();

                      if (aTime !== bTime) {
                        return bTime - aTime;
                      }

                      return a.id - b.id;
                    })
                    .map((loan) => {
                      const totalPayable = loan.totalWithInterest;

                      const remaining = totalPayable - loan.paidAmount;

                      const completed = loan.status === "completed" || remaining <= 0;

                      return (
                        <TableRow key={loan.loanId}>
                          <TableCell className="font-medium">
                            {loan.loanId}
                          </TableCell>
                          <TableCell>{loan.name}</TableCell>
                          <TableCell>#{loan.id}</TableCell>

                          <TableCell>
                            Rs. {loan.loanAmount.toLocaleString()}
                          </TableCell>

                          <TableCell>{loan.interestRate}%</TableCell>

                          <TableCell>{loan.duration} Months</TableCell>

                          <TableCell className="font-medium text-blue-600">
                            Rs. {totalPayable.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-red-600 font-medium">
                            Rs. {remaining.toLocaleString()}
                          </TableCell>

                          <TableCell>
                            {completed ? (
                              <Badge className="bg-green-500">Completed</Badge>
                            ) : (
                              <Badge variant="destructive">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-zinc-500"
                    >
                      No loans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
