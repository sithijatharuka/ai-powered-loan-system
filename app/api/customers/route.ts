import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import { Customer } from "@/lib/model/customerModel";

export const runtime = "nodejs";

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function serializeCustomer(customer: {
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
    id: customer._id.toString(),
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

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

    const query = search
      ? {
          $or: [
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