import { NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { computeDashboardSummary } from "@/lib/summary";
import { Customer } from "@/lib/model/customerModel";
import { User } from "@/lib/model/userModel";

export const runtime = "nodejs";

type SerializedTransaction = {
    customerId: string;
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

        // Delegate all summary calculations to a shared helper to keep the route
        // focused on data fetching and response formatting.
        const summary = computeDashboardSummary(customers);

        return NextResponse.json({
            success: true,
            summary: {
                ...summary,
                officersCount,
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