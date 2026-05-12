import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Counter } from "@/lib/model/counterModel";
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
    status?: "ongoing" | "completed";
    createdAt?: Date;
    updatedAt?: Date;
}) {
    const remaining = Math.max(
        Number(customer.totalWithInterest || 0) - Number(customer.paidAmount || 0),
        0,
    );

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
        status: customer.status ?? (remaining > 0 ? "ongoing" : "completed"),
        transactions: customer.transactions,
        loanHistory: customer.loanHistory ?? [],
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
}

async function backfillCustomerIds() {
    const customersWithoutId = await Customer.find({ customerId: { $exists: false } }).sort({ createdAt: 1 });

    if (customersWithoutId.length === 0) {
        return;
    }

    const existingMax = await Customer.findOne({ customerId: { $exists: true } })
        .sort({ customerId: -1 })
        .select("customerId");

    const maxCustomerId = existingMax?.customerId ?? 0;

    await Counter.findOneAndUpdate(
        { name: "customerId" },
        { $max: { seq: maxCustomerId } },
        { upsert: true, returnDocument: "after" },
    );

    for (const customer of customersWithoutId) {
        const counter = await Counter.findOneAndUpdate(
            { name: "customerId" },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: "after" },
        );

        customer.customerId = counter.seq;
        await customer.save();
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDb();
        await backfillCustomerIds();

        const customerIdParam = request.nextUrl.searchParams.get("customerId")?.trim() ?? "";
        const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
        const exactCustomerId = Number(customerIdParam);
        const hasExactCustomerId = customerIdParam !== "" && Number.isInteger(exactCustomerId);

        if (customerIdParam !== "" && !hasExactCustomerId) {
            return NextResponse.json(
                { success: false, message: "customerId must be a valid integer" },
                { status: 400 }
            );
        }

        const query = hasExactCustomerId
            ? { customerId: exactCustomerId }
            : (() => {
                const numericSearch = Number(search);
                const hasNumericSearch = search !== "" && Number.isInteger(numericSearch);

                return search
                    ? {
                        $or: [
                            ...(hasNumericSearch ? [{ customerId: numericSearch }] : []),
                            { name: { $regex: search, $options: "i" } },
                            { contact: { $regex: search, $options: "i" } },
                            { address: { $regex: search, $options: "i" } },
                        ],
                    }
                    : {};
            })();

        const customers = await Customer.find(query).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            customers: customers.map(serializeCustomer),
        });
    } catch (error) {
        console.error("Failed to fetch customers:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const name = String(body?.name ?? "").trim();
        const contact = String(body?.contact ?? "").trim();
        const address = String(body?.address ?? "").trim();
        const loanAmount = toNumber(body?.loanAmount);
        const interestRate = toNumber(body?.interestRate);
        const duration = toNumber(body?.duration);

        if (!name || !contact || !address) {
            return NextResponse.json(
                { success: false, message: "Name, contact, and address are required" },
                { status: 400 }
            );
        }

        if ([loanAmount, interestRate, duration].some((value) => Number.isNaN(value))) {
            return NextResponse.json(
                { success: false, message: "Loan amount, interest rate, and duration must be numbers" },
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

        await connectToDb();
        await backfillCustomerIds();

        const customer = await Customer.create({
            name,
            contact,
            address,
            loanAmount,
            interestRate,
            duration,
            totalWithInterest,
            monthlyPayment,
            dailyPayment,
            paidAmount: Number(body?.paidAmount) || 0,
            transactions: Array.isArray(body?.transactions) ? body.transactions : [],
        });

        return NextResponse.json(
            {
                success: true,
                message: "Customer created successfully",
                customer: serializeCustomer(customer),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create customer:", error);

        return NextResponse.json(
            { success: false, message: "Failed to create customer" },
            { status: 500 }
        );
    }
}