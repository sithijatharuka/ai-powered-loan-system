import { NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";
import { User } from "@/lib/model/userModel";

export const runtime = "nodejs";

type SerializedTransaction = {
    customerId: number;
    customerName: string;
    amount: number;
    date: string;
    note?: string;
};

export async function GET() {
    try {
        await connectToDb();

        const customers = await Customer.find({}).sort({ createdAt: -1 }).lean();
        const officersCount = await User.countDocuments({ role: "officer" });

        let totalLoanGiven = 0;
        let totalCollected = 0;
        let pendingLoan = 0;
        let activeCustomers = 0;
        const transactions: SerializedTransaction[] = [];
        let profitFromLoanInterest = 0;

        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        let collectedLast30Days = 0;
        let collectedLast7Days = 0;

        for (const customer of customers) {
            const remaining = Math.max(
                Number(customer.totalWithInterest || 0) - Number(customer.paidAmount || 0),
                0,
            );

            totalLoanGiven += Number(customer.loanAmount || 0);
            totalCollected += Number(customer.paidAmount || 0);
            pendingLoan += remaining;
            profitFromLoanInterest += Math.max(
                Number(customer.totalWithInterest || 0) - Number(customer.loanAmount || 0),
                0,
            );

            if (remaining > 0) {
                activeCustomers += 1;
            }

            for (const transaction of customer.transactions ?? []) {
                const transactionDate = new Date(transaction.date).getTime();

                if (Number.isNaN(transactionDate)) {
                    continue;
                }

                const entry = {
                    customerId: Number(customer.customerId ?? 0),
                    customerName: String(customer.name ?? "Unknown"),
                    amount: Number(transaction.amount || 0),
                    date: new Date(transaction.date).toISOString(),
                    note: transaction.note,
                } satisfies SerializedTransaction;

                transactions.push(entry);

                if (transactionDate >= thirtyDaysAgo) {
                    collectedLast30Days += Number(transaction.amount || 0);
                }

                if (transactionDate >= sevenDaysAgo) {
                    collectedLast7Days += Number(transaction.amount || 0);
                }
            }
        }

        transactions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return NextResponse.json({
            success: true,
            summary: {
                totalLoanGiven,
                totalCollected,
                pendingLoan,
                activeCustomers,
                officersCount,
                collectedLast7Days,
                collectedLast30Days,
                profitFromLoanInterest,
                recentTransactions: transactions.slice(0, 8),
            },
        });
    } catch (error) {
        console.error("Failed to load dashboard summary:", error);

        return NextResponse.json(
            { success: false, message: "Failed to load dashboard summary" },
            { status: 500 },
        );
    }
}