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

type LoanRow = {
  id: number;
  name: string;
  loanAmount: number;
  interestRate: number;
  duration: number;
  totalWithInterest: number;
  paidAmount: number;
};

export default function Loans() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format loan ID as L01, L02, etc.
  const formatLoanId = (id: number): string => `L${String(id).padStart(2, "0")}`;

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

        setLoans((data.customers ?? []) as LoanRow[]);
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
          <CardTitle>Active Loans</CardTitle>
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
                    .sort((a, b) => a.id - b.id)
                    .map((loan) => {
                      const totalPayable = loan.totalWithInterest;

                      const remaining = totalPayable - loan.paidAmount;

                      const completed = remaining <= 0;

                      return (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">
                            {formatLoanId(loan.id)}
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
