import { connectDB } from "@/db/connection";

import { loginSchema } from "@/backend/validations/auth.validation";

import { loginUser } from "@/backend/services/auth.service";

import { NextResponse } from "next/server";

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const validatedData =
      loginSchema.parse(body);

    const data = await loginUser(
      validatedData.name,
      validatedData.password
    );

    const response = NextResponse.json({
      success: true,
      user: data.user,
    });

    response.cookies.set(
      "token",
      data.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 400,
      }
    );
  }
}