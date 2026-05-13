"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [loans, setLoans] = useState<
    Array<
      CustomerLoan & {
        loanId: string;
        openedAt?: string | Date;
        closedAt?: string | Date;
        status: "ongoing" | "completed";
      }
    >
  >([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format loan ID as L01, L02, etc.
  const formatLoanId = (index: number): string =>
    `L${String(index).padStart(2, "0")}`;

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

        const flattenedLoans = (data.customers ?? [])
          .flatMap((customer: CustomerLoan) => {
            const currentTotal = Number(customer.totalWithInterest || 0);
            const currentPaid = Number(customer.paidAmount || 0);
            const currentRemaining = Math.max(currentTotal - currentPaid, 0);
            const currentStatus: "ongoing" | "completed" =
              currentRemaining > 0 ? "ongoing" : "completed";

            const currentLoan = {
              ...customer,
              status: currentStatus,
              openedAt: customer.openedAt ?? customer.createdAt,
              closedAt:
                currentStatus === "completed" ? customer.updatedAt : undefined,
            };

            const historyLoans = (customer.loanHistory ?? []).map((loan) => {
              const historyRemaining = Math.max(
                Number(loan.totalWithInterest || 0) -
                  Number(loan.paidAmount || 0),
                0,
              );

              return {
                ...customer,
                loanAmount: loan.loanAmount,
                interestRate: loan.interestRate,
                duration: loan.duration,
                totalWithInterest: loan.totalWithInterest,
                paidAmount: loan.paidAmount,
                status:
                  loan.status ??
                  (historyRemaining > 0 ? "ongoing" : "completed"),
                openedAt: loan.openedAt,
                closedAt: loan.closedAt,
              };
            });

            return [currentLoan, ...historyLoans];
          })
          .map((loan: CustomerLoan, index: number) => ({
            ...loan,
            loanId: formatLoanId(index + 1),
          }));

        setLoans(flattenedLoans);
      } finally {
        setLoading(false);
      }
    }

    void loadLoans();
  }, []);

  return (
    <div className="w-full p-3 sm:p-6 space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Loans</h1>

        <p className="text-xs sm:text-sm text-muted-foreground">
          Individual customer loan details
        </p>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden overflow-x-auto">
        <Table>
          {/* TABLE HEADER */}
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Loan ID
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Customer Name
              </TableHead>

              <TableHead className="hidden sm:table-cell whitespace-nowrap text-xs sm:text-sm">
                Customer ID
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Loan Amount
              </TableHead>

              <TableHead className="hidden md:table-cell whitespace-nowrap text-xs sm:text-sm">
                Interest
              </TableHead>

              <TableHead className="hidden md:table-cell whitespace-nowrap text-xs sm:text-sm">
                Duration
              </TableHead>

              <TableHead className="hidden lg:table-cell whitespace-nowrap text-xs sm:text-sm">
                Total Payable
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Remaining
              </TableHead>

              <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* TABLE BODY */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                >
                  Loading loans...
                </TableCell>
              </TableRow>
            ) : loans.length > 0 ? (
              loans
                .sort((a, b) => {
                  return a.id - b.id;
                })
                .map((loan, index) => {
                  const displayLoanId = formatLoanId(index + 1);
                  const totalPayable = loan.totalWithInterest;

                  const remaining = totalPayable - loan.paidAmount;

                  const completed =
                    loan.status === "completed" || remaining <= 0;

                  return (
                    <TableRow key={loan.loanId}>
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {displayLoanId}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        {loan.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">
                        {loan.id}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        Rs. {loan.loanAmount.toLocaleString()}
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                        {loan.interestRate}%
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                        {loan.duration} Months
                      </TableCell>

                      <TableCell className="hidden lg:table-cell font-medium text-xs sm:text-sm whitespace-nowrap">
                        Rs. {totalPayable.toLocaleString()}
                      </TableCell>

                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        Rs. {remaining.toLocaleString()}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {completed ? (
                          <Badge
                            className="bg-green-500 text-xs"
                            variant="default"
                          >
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="text-xs" variant="destructive">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                >
                  No loans found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
