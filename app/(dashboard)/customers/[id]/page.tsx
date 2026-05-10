import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";
import { notFound } from "next/navigation";
import AddLoanDialog from "@/components/AddLoanDialog";

type CustomerTransaction = {
  amount: number;
  date: string | Date;
  note?: string;
};

type LoanRecord = {
  loanAmount: number;
  interestRate: number;
  duration: number;
  totalWithInterest: number;
  monthlyPayment: number;
  dailyPayment: number;
  paidAmount: number;
  transactions: CustomerTransaction[];
  status?: "ongoing" | "completed";
  openedAt?: string | Date;
  closedAt?: string | Date;
};

export default async function CustomerDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = await params;
  const numericCustomerId = Number(customerId);

  if (!Number.isInteger(numericCustomerId) || numericCustomerId <= 0) {
    notFound();
  }

  await connectToDb();

  const customer = await Customer.findOne({
    customerId: numericCustomerId,
  }).lean();

  if (!customer) {
    notFound();
  }

  const totalWithInterest =
    customer.totalWithInterest ??
    customer.loanAmount +
      (customer.loanAmount * customer.interestRate * customer.duration) / 100;

  const remaining = totalWithInterest - customer.paidAmount;
  const isLoanComplete = remaining <= 0;
  const currentLoan: LoanRecord = {
    loanAmount: customer.loanAmount,
    interestRate: customer.interestRate,
    duration: customer.duration,
    totalWithInterest,
    monthlyPayment: customer.monthlyPayment,
    dailyPayment: customer.dailyPayment,
    paidAmount: customer.paidAmount,
    transactions: customer.transactions as CustomerTransaction[],
    status: isLoanComplete ? "completed" : "ongoing",
    openedAt: customer.createdAt,
    closedAt: isLoanComplete ? customer.updatedAt : undefined,
  };

  const percentPaid = totalWithInterest > 0 ? Math.max(0, Math.min(100, Math.round((customer.paidAmount / totalWithInterest) * 100))) : 0;

  const completedLoans = [
    ...((customer.loanHistory as LoanRecord[] | undefined) ?? []),
    ...(currentLoan.status === "completed" ? [currentLoan] : []),
  ];

  const ongoingLoans = currentLoan.status === "ongoing" ? [currentLoan] : [];

  const formatCurrency = (value: number) => `Rs. ${value.toLocaleString()}`;

  function renderLoanCard(loan: LoanRecord, index: number) {
    const balance = Math.max(loan.totalWithInterest - loan.paidAmount, 0);

    return (
      <div
        key={`${loan.loanAmount}-${loan.openedAt ? new Date(loan.openedAt).toISOString() : index}`}
        className="rounded-xl border bg-white p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">
              Rs. {loan.loanAmount.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500">
              {loan.interestRate}% interest · {loan.duration} months
            </p>
          </div>

          <Badge
            variant={loan.status === "completed" ? "default" : "destructive"}
          >
            {loan.status === "completed" ? "Completed" : "Ongoing"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-zinc-500">Total Payable</p>
            <p className="font-medium">
              Rs. {loan.totalWithInterest.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Paid Amount</p>
            <p className="font-medium">
              Rs. {loan.paidAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Remaining</p>
            <p className="font-medium text-red-600">
              Rs. {balance.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Transactions</p>
            <p className="font-medium">{loan.transactions.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="rounded-3xl border bg-linear-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-white/10 text-white border-white/15">
                Customer #{customer.customerId}
              </Badge>
              <Badge
                variant={isLoanComplete ? "default" : "destructive"}
                className="rounded-full"
              >
                {isLoanComplete ? "Ready for new loan" : "Active loan"}
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {customer.name}
              </h1>
              <p className="text-sm text-white/70 mt-1">
                {customer.contact} · {customer.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-44">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Outstanding
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(remaining)}
              </p>
            </div>

            {isLoanComplete ? (
              <AddLoanDialog
                customerId={customer.customerId}
                customerName={customer.name}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 max-w-xs">
                Complete the current loan to unlock a new loan.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-zinc-500">Customer ID</p>
              <p className="font-semibold">#{customer.customerId}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Contact</p>
              <p className="font-semibold">{customer.contact}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Address</p>
              <p className="font-semibold">{customer.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Loan Overview</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-zinc-500">Loan Amount</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(customer.loanAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-zinc-500">Interest Rate</p>
                <p className="mt-1 text-lg font-semibold">
                  {customer.interestRate}%
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-zinc-500">Duration</p>
                <p className="mt-1 text-lg font-semibold">
                  {customer.duration} months
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-zinc-500">Total Payable</p>
                <p className="mt-1 text-lg font-semibold text-blue-600">
                  {formatCurrency(totalWithInterest)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-zinc-500">Paid</p>
                <p className="mt-1 text-xl font-semibold text-green-600">
                  {formatCurrency(customer.paidAmount)}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-zinc-500">Remaining</p>
                <p className="mt-1 text-xl font-semibold text-red-600">
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Progress bar for current loan repayment */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-500">Repayment Progress</p>
                <p className="text-sm font-medium">{percentPaid}%</p>
              </div>

              <div className="w-full bg-zinc-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-600"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <details open className="rounded-2xl border bg-zinc-50/70 p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold">
              <span>Ongoing Loans</span>
              <span className="text-sm text-zinc-500">
                {ongoingLoans.length}
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              {ongoingLoans.length > 0 ? (
                ongoingLoans.map((loan, index) => renderLoanCard(loan, index))
              ) : (
                <p className="text-sm text-zinc-500">No ongoing loans.</p>
              )}
            </div>
          </details>

          <details className="rounded-2xl border bg-zinc-50/70 p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold">
              <span>Completed Loans</span>
              <span className="text-sm text-zinc-500">
                {completedLoans.length}
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              {completedLoans.length > 0 ? (
                completedLoans.map((loan, index) => renderLoanCard(loan, index))
              ) : (
                <p className="text-sm text-zinc-500">No completed loans yet.</p>
              )}
            </div>
          </details>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(customer.transactions as CustomerTransaction[]).length > 0 ? (
                  (customer.transactions as CustomerTransaction[]).map(
                    (t, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {new Date(t.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-24 text-center text-zinc-500"
                    >
                      No transactions yet.
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
