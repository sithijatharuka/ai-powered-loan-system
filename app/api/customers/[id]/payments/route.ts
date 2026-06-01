import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

type PaymentTransaction = {
    amount: number;
    date: Date;
    note?: string;
};

function getTransactionIndex(body: unknown, transactions: PaymentTransaction[]) {
    const index = Number((body as { transactionIndex?: unknown })?.transactionIndex);

    if (Number.isInteger(index) && index >= 0 && index < transactions.length) {
        return index;
    }

    return transactions.length - 1;
}

function normalizeCustomerId(value: string) {
    return value.trim().toUpperCase();
}

function isValidCustomerId(value: string) {
    return /^[A-Z0-9]+$/.test(value);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = normalizeCustomerId(id);

        if (!isValidCustomerId(customerId)) {
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = normalizeCustomerId(id);

        if (!isValidCustomerId(customerId)) {
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

        if (!Array.isArray(customer.transactions) || customer.transactions.length === 0) {
            return NextResponse.json(
                { success: false, message: "No payment records found for this customer" },
                { status: 400 }
            );
        }

        const transactionIndex = getTransactionIndex(body, customer.transactions);

        if (transactionIndex < 0) {
            return NextResponse.json(
                { success: false, message: "No payment records found for this customer" },
                { status: 400 }
            );
        }

        const existingTransaction = customer.transactions[transactionIndex] as PaymentTransaction;
        const updatedTransaction: PaymentTransaction = {
            amount,
            date: body?.date ? new Date(body.date) : new Date(existingTransaction.date),
            note: String(body?.note ?? existingTransaction.note ?? "Payment received"),
        };

        customer.transactions[transactionIndex] = updatedTransaction as never;
        customer.paidAmount = customer.transactions.reduce(
            (sum: number, transaction: PaymentTransaction) => sum + Number(transaction.amount || 0),
            0,
        );

        await customer.save();

        return NextResponse.json({
            success: true,
            message: "Payment updated successfully",
            customer: {
                id: customer.customerId,
                paidAmount: customer.paidAmount,
                transactions: customer.transactions,
            },
            transaction: updatedTransaction,
        });
    } catch (error) {
        console.error("Failed to update payment:", error);

        return NextResponse.json(
            { success: false, message: "Failed to update payment" },
            { status: 500 }
        );
    }
}