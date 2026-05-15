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
    loanStatus?: "ongoing" | "completed";
    remaining?: number;
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
        let monthlyProfit = 0;
        let monthlyCollected = 0;
        let monthlyLoanGiven = 0;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthStartTs = startOfMonth.getTime();

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

            if (remaining > 0) {
                activeCustomers += 1;
            }

            // Count loan given in current month by customer creation date
            const createdTs = new Date(customer.createdAt).getTime();
            if (!Number.isNaN(createdTs) && createdTs >= monthStartTs) {
                monthlyLoanGiven += Number(customer.loanAmount || 0);
            }

            const interestRate = Number(customer.interestRate || 0);

            for (const transaction of customer.transactions ?? []) {
                const transactionDate = new Date(transaction.date).getTime();

                if (Number.isNaN(transactionDate)) {
                    continue;
                }

                const paymentAmount = Number(transaction.amount || 0);
                const profit = (paymentAmount / (100 + interestRate)) * interestRate;

                const entry = {
                    customerId: Number(customer.customerId ?? 0),
                    customerName: String(customer.name ?? "Unknown"),
                    amount: paymentAmount,
                    date: new Date(transaction.date).toISOString(),
                    note: transaction.note,
                    loanStatus: remaining > 0 ? "ongoing" : "completed",
                    remaining,
                } satisfies SerializedTransaction;

                transactions.push(entry);
                profitFromLoanInterest += profit;
                if (transactionDate >= monthStartTs) {
                    monthlyCollected += paymentAmount;
                }

                if (transactionDate >= thirtyDaysAgo) {
                    collectedLast30Days += paymentAmount;
                }

                if (transactionDate >= sevenDaysAgo) {
                    collectedLast7Days += paymentAmount;
                }

                if (transactionDate >= monthStartTs) {
                    monthlyProfit += profit;
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
                monthlyProfit,
                monthlyCollected,
                monthlyLoanGiven,
                totalCustomers: customers.length,
                monthName: startOfMonth.toLocaleString(undefined, { month: "long" }),
                recentTransactions: transactions.slice(0, 5),
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