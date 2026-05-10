import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

function toNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
}

function serializeCustomer(customer: {
    customerId?: number;
    _id: { toString(): string };
    name: string;
    contact: string;
    address: string;
    loanAmount: number;
    interestRate: number;
    duration: number;
    totalWithInterest: number;
    monthlyPayment: number;
    dailyPayment: number;
    paidAmount: number;
    transactions: Array<{ amount: number; date: Date; note?: string }>;
    createdAt?: Date;
    updatedAt?: Date;
}) {
    return {
        id: customer.customerId,
        mongoId: customer._id.toString(),
        name: customer.name,
        contact: customer.contact,
        address: customer.address,
        loanAmount: customer.loanAmount,
        interestRate: customer.interestRate,
        duration: customer.duration,
        totalWithInterest: customer.totalWithInterest,
        monthlyPayment: customer.monthlyPayment,
        dailyPayment: customer.dailyPayment,
        paidAmount: customer.paidAmount,
        transactions: customer.transactions,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
}

export async function GET(
    _request: NextRequest,
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

        await connectToDb();

        const customer = await Customer.findOne({ customerId });

        if (!customer) {
            return NextResponse.json(
                { success: false, message: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            customer: serializeCustomer(customer),
        });
    } catch (error) {
        console.error("Failed to fetch customer:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch customer" },
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
        const customerId = Number(id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid customer ID" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => null);

        await connectToDb();

        const update = {
            name: body?.name,
            contact: body?.contact,
            address: body?.address,
            loanAmount: Number.isFinite(Number(body?.loanAmount)) ? Number(body.loanAmount) : undefined,
            interestRate: Number.isFinite(Number(body?.interestRate)) ? Number(body.interestRate) : undefined,
            duration: Number.isFinite(Number(body?.duration)) ? Number(body.duration) : undefined,
            totalWithInterest: Number.isFinite(Number(body?.totalWithInterest)) ? Number(body.totalWithInterest) : undefined,
            monthlyPayment: Number.isFinite(Number(body?.monthlyPayment)) ? Number(body.monthlyPayment) : undefined,
            dailyPayment: Number.isFinite(Number(body?.dailyPayment)) ? Number(body.dailyPayment) : undefined,
            paidAmount: Number.isFinite(Number(body?.paidAmount)) ? Number(body.paidAmount) : undefined,
        };

        Object.keys(update).forEach((key) => {
            if (update[key as keyof typeof update] === undefined) {
                delete update[key as keyof typeof update];
            }
        });

        const customer = await Customer.findOneAndUpdate(
            { customerId },
            update,
            { returnDocument: "after" }
        );

        if (!customer) {
            return NextResponse.json(
                { success: false, message: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            customer: serializeCustomer(customer),
        });
    } catch (error) {
        console.error("Failed to update customer:", error);

        return NextResponse.json(
            { success: false, message: "Failed to update customer" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
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

        await connectToDb();

        const customer = await Customer.findOneAndDelete({ customerId });

        if (!customer) {
            return NextResponse.json(
                { success: false, message: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete customer:", error);

        return NextResponse.json(
            { success: false, message: "Failed to delete customer" },
            { status: 500 }
        );
    }
}