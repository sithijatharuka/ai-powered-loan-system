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
    loanHistory?: Array<{
        loanAmount: number;
        interestRate: number;
        duration: number;
        totalWithInterest: number;
        monthlyPayment: number;
        dailyPayment: number;
        paidAmount: number;
        transactions: Array<{ amount: number; date: Date; note?: string }>;
        status?: "ongoing" | "completed";
        openedAt?: Date;
        closedAt?: Date;
    }>;
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
        loanHistory: customer.loanHistory ?? [],
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
}

function buildLoanSnapshot(customer: {
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
    loanHistory?: Array<any>;
}) {
    const remaining = Math.max(
        Number(customer.totalWithInterest || 0) - Number(customer.paidAmount || 0),
        0
    );

    return {
        loanAmount: customer.loanAmount,
        interestRate: customer.interestRate,
        duration: customer.duration,
        totalWithInterest: customer.totalWithInterest,
        monthlyPayment: customer.monthlyPayment,
        dailyPayment: customer.dailyPayment,
        paidAmount: customer.paidAmount,
        transactions: customer.transactions,
        status: remaining > 0 ? ("ongoing" as const) : ("completed" as const),
        openedAt: customer.createdAt,
        closedAt: remaining > 0 ? undefined : customer.updatedAt,
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

        const existingCustomer = await Customer.findOne({ customerId });

        if (!existingCustomer) {
            return NextResponse.json(
                { success: false, message: "Customer not found" },
                { status: 404 }
            );
        }

        if (body?.newLoan) {
            const remainingBalance =
                Number(existingCustomer.totalWithInterest || 0) -
                Number(existingCustomer.paidAmount || 0);

            if (remainingBalance > 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Previous loan must be fully paid before adding a new loan",
                    },
                    { status: 400 }
                );
            }

            const loanAmount = Number.isFinite(Number(body?.loanAmount))
                ? Number(body.loanAmount)
                : NaN;
            const interestRate = Number.isFinite(Number(body?.interestRate))
                ? Number(body.interestRate)
                : NaN;
            const duration = Number.isFinite(Number(body?.duration))
                ? Number(body.duration)
                : NaN;

            if ([loanAmount, interestRate, duration].some((value) => Number.isNaN(value))) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Loan amount, interest rate, and duration are required",
                    },
                    { status: 400 }
                );
            }

            const totalWithInterest =
                Number(body?.totalWithInterest) ||
                loanAmount + loanAmount * (interestRate / 100) * duration;
            const monthlyPayment =
                Number(body?.monthlyPayment) || (duration > 0 ? totalWithInterest / duration : 0);
            const dailyPayment =
                Number(body?.dailyPayment) ||
                (duration > 0 ? totalWithInterest / (duration * 30) : 0);

            const completedLoan = buildLoanSnapshot(existingCustomer);
            const loanHistory = [
                ...(existingCustomer.loanHistory ?? []),
                completedLoan,
            ];

            const customer = await Customer.findOneAndUpdate(
                { customerId },
                {
                    name: body?.name ?? existingCustomer.name,
                    contact: body?.contact ?? existingCustomer.contact,
                    address: body?.address ?? existingCustomer.address,
                    loanAmount,
                    interestRate,
                    duration,
                    totalWithInterest,
                    monthlyPayment,
                    dailyPayment,
                    paidAmount: 0,
                    transactions: [],
                    loanHistory,
                },
                { returnDocument: "after" }
            );

            return NextResponse.json({
                success: true,
                message: "New loan added successfully",
                customer: serializeCustomer(customer),
            });
        }

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