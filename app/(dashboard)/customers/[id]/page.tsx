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
import DeleteCustomerDialog from "@/components/DeleteCustomerDialog";

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

  const percentPaid =
    totalWithInterest > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((customer.paidAmount / totalWithInterest) * 100),
          ),
        )
      : 0;

  // Calculate loan dates
  const loanStartDate = new Date(customer.createdAt);
  const loanFinishDate = new Date(loanStartDate);
  loanFinishDate.setMonth(loanFinishDate.getMonth() + customer.duration);

  const completedLoans = [
    ...((customer.loanHistory as LoanRecord[] | undefined) ?? []),
    ...(currentLoan.status === "completed" ? [currentLoan] : []),
  ];

  const ongoingLoans = currentLoan.status === "ongoing" ? [currentLoan] : [];

  const formatCurrency = (value: number) => `Rs. ${value.toLocaleString()}`;

  const transactionRecords = customer.transactions as CustomerTransaction[];

  const getDateKey = (value: string | Date) => new Date(value).toDateString();

  const dailyTransactionMap = transactionRecords.reduce<Record<string, number>>(
    (accumulator, transaction) => {
      const dateKey = getDateKey(transaction.date);
      accumulator[dateKey] = (accumulator[dateKey] ?? 0) + Number(transaction.amount || 0);
      return accumulator;
    },
    {},
  );

  const dailyLedgerRows: Array<{ date: Date; amount?: number }> = [];
  const ledgerStartDate = new Date(customer.createdAt);
  const ledgerEndDate = new Date();
  ledgerStartDate.setHours(0, 0, 0, 0);
  ledgerEndDate.setHours(0, 0, 0, 0);

  for (
    const currentDate = new Date(ledgerStartDate);
    currentDate <= ledgerEndDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dateKey = currentDate.toDateString();
    const amount = dailyTransactionMap[dateKey];

    dailyLedgerRows.push({
      date: new Date(currentDate),
      amount: amount && amount > 0 ? amount : undefined,
    });
  }

  dailyLedgerRows.reverse();

  function renderLoanCard(loan: LoanRecord, index: number) {
    const balance = Math.max(loan.totalWithInterest - loan.paidAmount, 0);

    return (
      <div
        key={`${loan.loanAmount}-${loan.openedAt ? new Date(loan.openedAt).toISOString() : index}`}
        className="rounded-xl border bg-white p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div>
            <p className="font-semibold text-sm sm:text-base">
              Rs. {loan.loanAmount.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-zinc-500">
              {loan.interestRate}% interest · {loan.duration}mo
            </p>
          </div>

          <Badge
            variant={loan.status === "completed" ? "default" : "destructive"}
            className="w-fit text-xs sm:text-sm"
          >
            {loan.status === "completed" ? "Completed" : "Ongoing"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div>
            <p className="text-zinc-500">Total Payable</p>
            <p className="font-medium text-xs sm:text-sm">
              Rs. {loan.totalWithInterest.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Paid Amount</p>
            <p className="font-medium text-xs sm:text-sm">
              Rs. {loan.paidAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Remaining</p>
            <p className="font-medium text-red-600 text-xs sm:text-sm">
              Rs. {balance.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Transactions</p>
            <p className="font-medium text-xs sm:text-sm">
              {loan.transactions.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-8 max-w-6xl mx-auto">
      <div className="rounded-3xl border bg-linear-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge className="rounded-full bg-white/10 text-white border-white/15 text-xs sm:text-sm">
                Customer #{customer.customerId}
              </Badge>
              <Badge
                variant={isLoanComplete ? "default" : "destructive"}
                className="rounded-full text-xs sm:text-sm"
              >
                {isLoanComplete ? "Ready for new loan" : "Active loan"}
              </Badge>
            </div>

            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight line-clamp-2">
                {customer.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-1 line-clamp-2">
                {customer.contact} · {customer.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row w-full sm:w-auto">
            <div className="rounded-2xl bg-white/10 px-3 sm:px-4 py-2 sm:py-3 min-w-44">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Outstanding
              </p>
              <p className="text-base sm:text-lg font-semibold">
                {formatCurrency(remaining)}
              </p>
            </div>

            {isLoanComplete ? (
              <AddLoanDialog
                customerId={customer.customerId}
                customerName={customer.name}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white/75">
                Complete the current loan to unlock a new loan.
              </div>
            )}

            <DeleteCustomerDialog
              customerId={customer.customerId}
              customerName={customer.name}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Customer Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="text-zinc-500">Customer ID</p>
              <p className="font-semibold">#{customer.customerId}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Contact</p>
              <p className="font-semibold break-all">{customer.contact}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500">Address</p>
              <p className="font-semibold break-all">{customer.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Current Loan Overview
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="rounded-xl bg-zinc-50 p-3 sm:p-4">
                <p className="text-zinc-500 text-xs">Loan Amount</p>
                <p className="mt-1 text-sm sm:text-lg font-semibold">
                  {formatCurrency(customer.loanAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 sm:p-4">
                <p className="text-zinc-500 text-xs">Interest Rate</p>
                <p className="mt-1 text-sm sm:text-lg font-semibold">
                  {customer.interestRate}%
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 sm:p-4">
                <p className="text-zinc-500 text-xs">Duration</p>
                <p className="mt-1 text-sm sm:text-lg font-semibold">
                  {customer.duration}mo
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 sm:p-4">
                <p className="text-zinc-500 text-xs">Total Payable</p>
                <p className="mt-1 text-sm sm:text-lg font-semibold text-blue-600">
                  {formatCurrency(totalWithInterest)}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-zinc-500">Paid</p>
                <p className="mt-1 text-base sm:text-xl font-semibold text-green-600">
                  {formatCurrency(customer.paidAmount)}
                </p>
              </div>

              <div className="rounded-xl border p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-zinc-500">Remaining</p>
                <p className="mt-1 text-base sm:text-xl font-semibold text-red-600">
                  {formatCurrency(remaining)}
                </p>
              </div>

              <div className="rounded-xl border p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-zinc-500">
                  Daily Payment
                </p>
                <p className="mt-1 text-base sm:text-xl font-semibold">
                  {formatCurrency(customer.dailyPayment)}
                </p>
              </div>

              <div className="rounded-xl border p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-zinc-500">
                  Loan Start Date
                </p>
                <p className="mt-1 text-base sm:text-xl font-semibold">
                  {loanStartDate.toLocaleDateString()}
                </p>
              </div>

              <div className="rounded-xl border p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-zinc-500">
                  Loan Finish Date
                </p>
                <p className="mt-1 text-base sm:text-xl font-semibold">
                  {loanFinishDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress bar for current loan repayment */}
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-zinc-500">
                  Repayment Progress
                </p>
                <p className="text-xs sm:text-sm font-medium">{percentPaid}%</p>
              </div>

              <div className="w-full bg-zinc-200 rounded-full h-2 sm:h-3">
                <div
                  className="h-2 sm:h-3 rounded-full bg-green-600"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Loan History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <details open className="rounded-2xl border bg-zinc-50/70 p-3 sm:p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-sm sm:text-base">
              <span>Ongoing Loans</span>
              <span className="text-xs sm:text-sm text-zinc-500">
                {ongoingLoans.length}
              </span>
            </summary>

            <div className="mt-3 sm:mt-4 space-y-3">
              {ongoingLoans.length > 0 ? (
                ongoingLoans.map((loan, index) => renderLoanCard(loan, index))
              ) : (
                <p className="text-xs sm:text-sm text-zinc-500">
                  No ongoing loans.
                </p>
              )}
            </div>
          </details>

          <details className="rounded-2xl border bg-zinc-50/70 p-3 sm:p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-sm sm:text-base">
              <span>Completed Loans</span>
              <span className="text-xs sm:text-sm text-zinc-500">
                {completedLoans.length}
              </span>
            </summary>

            <div className="mt-3 sm:mt-4 space-y-3">
              {completedLoans.length > 0 ? (
                completedLoans.map((loan, index) => renderLoanCard(loan, index))
              ) : (
                <p className="text-xs sm:text-sm text-zinc-500">
                  No completed loans yet.
                </p>
              )}
            </div>
          </details>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Transaction History
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                    Date
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                    Payment
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dailyLedgerRows.length > 0 ? (
                  dailyLedgerRows.map((entry) => {
                    const dateKey = entry.date.toDateString();

                    return (
                      <TableRow key={dateKey}>
                        <TableCell className="text-xs sm:text-sm font-medium">
                          {entry.date.toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          className={
                            entry.amount !== undefined
                              ? "font-medium text-green-600 text-xs sm:text-sm"
                              : "font-medium text-zinc-500 text-xs sm:text-sm"
                          }
                        >
                          {entry.amount !== undefined
                            ? formatCurrency(entry.amount)
                            : "No payment done"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                    >
                      No payment records yet.
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
