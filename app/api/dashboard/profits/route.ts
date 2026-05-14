import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

type ProfitFilter = "today" | "last7days" | "custom" | "monthly";

type ProfitRow = {
    customerId: number;
    customerName: string;
    paymentAmount: number;
    interestRate: number;
    profit: number;
    date: string;
};

function parseDateFromYmd(value: string) {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function getDateRange(filter: ProfitFilter, searchParams: URLSearchParams) {
    const now = new Date();

    if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    if (filter === "last7days") {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6);

        return { start, end };
    }

    if (filter === "custom") {
        const startDate = searchParams.get("startDate") ?? "";
        const endDate = searchParams.get("endDate") ?? "";

        const start = parseDateFromYmd(startDate);
        const end = parseDateFromYmd(endDate);

        if (!start || !end) {
            return null;
        }

        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    const monthValue = searchParams.get("month") ?? "";
    const [yearRaw, monthRaw] = monthValue.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return null;
    }

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return { start, end };
}

function getFilterType(value: string | null): ProfitFilter {
    if (value === "today" || value === "last7days" || value === "custom" || value === "monthly") {
        return value;
    }

    return "today";
}

export async function GET(request: NextRequest) {
    try {
        const filter = getFilterType(request.nextUrl.searchParams.get("filter"));
        const dateRange = getDateRange(filter, request.nextUrl.searchParams);

        if (!dateRange) {
            return NextResponse.json(
                { success: false, message: "Invalid filter date range" },
                { status: 400 },
            );
        }

        await connectToDb();

        const customers = await Customer.find({}).lean();
        const rows: ProfitRow[] = [];
        let totalProfit = 0;

        for (const customer of customers) {
            const interestRate = Number(customer.interestRate || 0);

            for (const transaction of customer.transactions ?? []) {
                const amount = Number(transaction.amount || 0);
                const date = new Date(transaction.date);

                if (!Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) {
                    continue;
                }

                if (date < dateRange.start || date > dateRange.end) {
                    continue;
                }

                const profit = interestRate > 0
                    ? (amount / (100 + interestRate)) * interestRate
                    : 0;

                rows.push({
                    customerId: Number(customer.customerId ?? 0),
                    customerName: String(customer.name ?? "Unknown"),
                    paymentAmount: amount,
                    interestRate,
                    profit,
                    date: date.toISOString(),
                });

                totalProfit += profit;
            }
        }

        rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalPayments = rows.reduce((sum, row) => sum + row.paymentAmount, 0);

        return NextResponse.json({
            success: true,
            data: {
                filter,
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString(),
                rows,
                totalProfit,
                totalPayments,
            },
        });
    } catch (error) {
        console.error("Failed to load profits:", error);

        return NextResponse.json(
            { success: false, message: "Failed to load profits" },
            { status: 500 },
        );
    }
}