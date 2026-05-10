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

  const completedLoans = [
    ...((customer.loanHistory as LoanRecord[] | undefined) ?? []),
    ...(currentLoan.status === "completed" ? [currentLoan] : []),
  ];

  const ongoingLoans = currentLoan.status === "ongoing" ? [currentLoan] : [];

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

          <Badge variant={loan.status === "completed" ? "default" : "destructive"}>
            {loan.status === "completed" ? "Completed" : "Ongoing"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-zinc-500">Total Payable</p>
            <p className="font-medium">Rs. {loan.totalWithInterest.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-zinc-500">Paid Amount</p>
            <p className="font-medium">Rs. {loan.paidAmount.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-zinc-500">Remaining</p>
            <p className="font-medium text-red-600">Rs. {balance.toLocaleString()}</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>

        <p className="text-sm text-zinc-500 mt-1">
          View customer loan and payment information
        </p>
      </div>

      {/* Basic Information */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Customer ID</p>
              <p className="font-medium">#{customer.customerId}</p>
            </div>

            <div>
              <p className="text-zinc-500">Name</p>
              <p className="font-medium">{customer.name}</p>
            </div>

            <div>
              <p className="text-zinc-500">Contact</p>
              <p className="font-medium">{customer.contact}</p>
            </div>

            <div>
              <p className="text-zinc-500">Address</p>
              <p className="font-medium">{customer.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Details */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Loan Amount</p>
              <p className="font-medium">
                Rs. {customer.loanAmount.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Interest Rate</p>
              <p className="font-medium">{customer.interestRate}%</p>
            </div>

            <div>
              <p className="text-zinc-500">Duration</p>
              <p className="font-medium">{customer.duration} months</p>
            </div>

            <div>
              <p className="text-zinc-500">Total Payable</p>
              <p className="font-medium text-blue-600">
                Rs. {totalWithInterest.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-lg">Paid</Badge>

            <p className="font-medium">
              Rs. {customer.paidAmount.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="rounded-lg">
              Remaining
            </Badge>

            <p className="font-semibold text-red-600">
              Rs. {remaining.toLocaleString()}
            </p>
          </div>

          <div className="pt-2">
            {isLoanComplete ? (
              <AddLoanDialog
                customerId={customer.customerId}
                customerName={customer.name}
              />
            ) : (
              <p className="text-sm text-zinc-500">
                Complete the current loan before adding a new one.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(customer.transactions as CustomerTransaction[]).map(
                  (t, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(t.date).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="font-medium text-green-600">
                        Rs. {t.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Loan History */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <details open className="rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">
              Ongoing Loans ({ongoingLoans.length})
            </summary>

            <div className="mt-4 space-y-3">
              {ongoingLoans.length > 0 ? (
                ongoingLoans.map((loan, index) => renderLoanCard(loan, index))
              ) : (
                <p className="text-sm text-zinc-500">No ongoing loans.</p>
              )}
            </div>
          </details>

          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">
              Completed Loans ({completedLoans.length})
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
    </div>
  );
}
