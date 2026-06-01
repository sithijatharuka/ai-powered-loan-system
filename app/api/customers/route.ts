import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

function toNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
}

function normalizePhoneNumber(value: string) {
    return value.trim().replace(/\D/g, "");
}

function normalizeCustomerId(value: string) {
    return value.trim().toUpperCase();
}

function isValidCustomerId(value: string) {
    return /^[A-Z0-9]+$/.test(value);
}

function isValidPhoneNumber(value: string) {
    return /^0\d{9}$/.test(value);
}

function getDuplicateField(error: unknown) {
    const duplicateError = error as {
        code?: number;
        keyPattern?: Record<string, number>;
        message?: string;
    };

    if (duplicateError?.code !== 11000) {
        return null;
    }

    if (duplicateError.keyPattern?.customerId) {
        return "customerId";
    }

    if (duplicateError.keyPattern?.contact) {
        return "contact";
    }

    if (duplicateError.message?.includes("customerId")) {
        return "customerId";
    }

    if (duplicateError.message?.includes("contact")) {
        return "contact";
    }

    return "unknown";
}

function serializeCustomer(customer: {
    customerId?: string;
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

export async function GET(request: NextRequest) {
    try {
        await connectToDb();

        const identifier = request.nextUrl.searchParams.get("identifier")?.trim() ?? "";
        const customerIdParam = request.nextUrl.searchParams.get("customerId")?.trim() ?? "";
        const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

        if (customerIdParam !== "" && !isValidCustomerId(normalizeCustomerId(customerIdParam))) {
            return NextResponse.json(
                { success: false, message: "customerId must contain only letters and numbers" },
                { status: 400 }
            );
        }

        if (identifier !== "") {
            const normalizedIdentifier = normalizeCustomerId(identifier);
            const normalizedIdentifierPhone = normalizePhoneNumber(identifier);
            const hasValidIdentifierPhone = isValidPhoneNumber(normalizedIdentifierPhone);

            let customer = null;

            if (isValidCustomerId(normalizedIdentifier)) {
                customer = await Customer.findOne({ customerId: normalizedIdentifier });
            }

            if (!customer) {
                customer = await Customer.findOne({
                    contact: hasValidIdentifierPhone ? normalizedIdentifierPhone : identifier,
                });
            }

            return NextResponse.json({
                success: true,
                customers: customer ? [serializeCustomer(customer)] : [],
            });
        }

        const normalizedSearch = normalizeCustomerId(search);
        const query = customerIdParam
            ? { customerId: normalizeCustomerId(customerIdParam) }
            : search
                ? {
                    $or: [
                        ...(isValidCustomerId(normalizedSearch) ? [{ customerId: normalizedSearch }] : []),
                        { name: { $regex: search, $options: "i" } },
                        { contact: { $regex: search, $options: "i" } },
                        { address: { $regex: search, $options: "i" } },
                    ],
                }
                : {};

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
        const customerId = normalizeCustomerId(String(body?.customerId ?? ""));
        const name = String(body?.name ?? "").trim();
        const contact = normalizePhoneNumber(String(body?.contact ?? ""));
        const address = String(body?.address ?? "").trim();
        const loanAmount = toNumber(body?.loanAmount);
        const interestRate = toNumber(body?.interestRate);
        const duration = toNumber(body?.duration);

        if (!customerId || !name || !contact || !address) {
            return NextResponse.json(
                { success: false, message: "Customer ID, name, contact, and address are required" },
                { status: 400 }
            );
        }

        if (!isValidCustomerId(customerId)) {
            return NextResponse.json(
                { success: false, message: "Customer ID can only contain letters and numbers" },
                { status: 400 }
            );
        }

        if (!isValidPhoneNumber(contact)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number must start with 0 and contain exactly 10 digits",
                },
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

        const duplicateCustomerId = await Customer.findOne({ customerId }).select("customerId");

        if (duplicateCustomerId) {
            return NextResponse.json(
                { success: false, message: "Customer ID already exists" },
                { status: 409 }
            );
        }

        const duplicateContact = await Customer.findOne({ contact }).select("contact");

        if (duplicateContact) {
            return NextResponse.json(
                { success: false, message: "Customer phone number already exists" },
                { status: 409 }
            );
        }

        const customer = await Customer.create({
            customerId,
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
        const duplicateField = getDuplicateField(error);

        if (duplicateField === "customerId") {
            return NextResponse.json(
                { success: false, message: "Customer ID already exists" },
                { status: 409 }
            );
        }

        if (duplicateField === "contact") {
            return NextResponse.json(
                { success: false, message: "Customer phone number already exists" },
                { status: 409 }
            );
        }

        console.error("Failed to create customer:", error);

        return NextResponse.json(
            { success: false, message: "Failed to create customer" },
            { status: 500 }
        );
    }
}