import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = Number(id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid customer ID" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => null);
        const amount = Number(body?.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        await connectToDb();

        const customer = await Customer.findOne({ customerId });

        if (!customer) {
            return NextResponse.json(
                { success: false, message: "Customer not found" },
                { status: 404 }
            );
        }

        customer.paidAmount = Number(customer.paidAmount || 0) + amount;
        customer.transactions.push({
            amount,
            date: body?.date ? new Date(body.date) : new Date(),
            note: String(body?.note ?? "Payment received"),
        });

        await customer.save();

        return NextResponse.json({
            success: true,
            message: "Payment recorded successfully",
            customer: {
                id: customer.customerId,
                paidAmount: customer.paidAmount,
                transactions: customer.transactions,
            },
        });
    } catch (error) {
        console.error("Failed to record payment:", error);

        return NextResponse.json(
            { success: false, message: "Failed to record payment" },
            { status: 500 }
        );
    }
}