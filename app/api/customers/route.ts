import { NextRequest, NextResponse } from "next/server";
import { addCustomer } from "@/backend/db";

export async function POST(req: NextRequest) {
  // Read the customer data sent from the form
  const data = await req.json();

  // Save the customer to the database
  const customer = await addCustomer(data);

  // Send back the saved customer
  return NextResponse.json({ success: true, customer }, { status: 201 });
}
