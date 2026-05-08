"use client";

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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loans = [
  {
    id: 1,
    customer: "Kamal Perera",
    loanAmount: 100000,
    interestRate: 8,
    duration: 12,
    paid: 40000,
  },
  {
    id: 2,
    customer: "Nimal Silva",
    loanAmount: 75000,
    interestRate: 10,
    duration: 6,
    paid: 20000,
  },
];

export default function Loans() {
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          Loans
        </h1>

        <p className="text-sm text-muted-foreground">
          Individual customer loan details
        </p>
      </div>

      {/* TABLE CARD */}
      <Card className="rounded-2xl">

        <CardHeader>
          <CardTitle>
            Active Loans
          </CardTitle>
        </CardHeader>

        <CardContent>

          <div className="border rounded-xl overflow-hidden">

            <Table>

              {/* TABLE HEADER */}
              <TableHeader className="bg-zinc-50">
                <TableRow>

                  <TableHead>ID</TableHead>

                  <TableHead>Customer</TableHead>

                  <TableHead>Loan Amount</TableHead>

                  <TableHead>Interest</TableHead>

                  <TableHead>Duration</TableHead>

                  <TableHead>Total Payable</TableHead>

                  <TableHead>Remaining</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>

                </TableRow>
              </TableHeader>

              {/* TABLE BODY */}
              <TableBody>

                {loans.map((loan) => {

                  const totalInterest =
                    loan.loanAmount *
                    (loan.interestRate / 100) *
                    loan.duration;

                  const totalPayable =
                    loan.loanAmount + totalInterest;

                  const remaining =
                    totalPayable - loan.paid;

                  const completed =
                    remaining <= 0;

                  return (
                    <TableRow key={loan.id}>

                      <TableCell className="font-medium">
                        #{loan.id}
                      </TableCell>

                      <TableCell>
                        {loan.customer}
                      </TableCell>

                      <TableCell>
                        Rs. {loan.loanAmount.toLocaleString()}
                      </TableCell>

                      <TableCell>
                        {loan.interestRate}%
                      </TableCell>

                      <TableCell>
                        {loan.duration} Months
                      </TableCell>

                      <TableCell className="font-medium text-blue-600">
                        Rs. {totalPayable.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-red-600 font-medium">
                        Rs. {remaining.toLocaleString()}
                      </TableCell>

                      <TableCell>

                        {completed ? (
                          <Badge>
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Active
                          </Badge>
                        )}

                      </TableCell>

                      <TableCell className="text-right">

                        <Button
                          size="sm"
                          className="rounded-lg"
                        >
                          View
                        </Button>

                      </TableCell>

                    </TableRow>
                  );
                })}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}