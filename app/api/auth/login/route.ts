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
      validatedData.email,
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
        secure: false,
        sameSite: "lax",
        path: "/",
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