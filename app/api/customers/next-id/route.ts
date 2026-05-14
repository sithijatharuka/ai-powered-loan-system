import { NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Counter } from "@/lib/model/counterModel";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

export async function GET() {
    try {
        await connectToDb();

        const [counter, latestCustomer] = await Promise.all([
            Counter.findOne({ name: "customerId" }).select("seq"),
            Customer.findOne({}).sort({ customerId: -1 }).select("customerId"),
        ]);

        const currentCounterValue = Number(counter?.seq ?? 0);
        const currentHighestCustomerId = Number(latestCustomer?.customerId ?? 0);
        const nextCustomerId = Math.max(currentCounterValue, currentHighestCustomerId) + 1;

        return NextResponse.json({
            success: true,
            nextCustomerId,
        });
    } catch (error) {
        console.error("Failed to fetch next customer ID:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch next customer ID" },
            { status: 500 },
        );
    }
}