import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectToDb } from "@/lib/dbConnect";
import {
    getAuthUser,
    normalizeUsername,
    type UserRole,
} from "@/lib/auth";
import { User } from "@/lib/model/userModel";

export const runtime = "nodejs";

function sanitizeRole(role: unknown): UserRole {
    return role === "admin" ? "admin" : "officer";
}

export async function GET(request: NextRequest) {
    try {
        const currentUser = getAuthUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (currentUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        await connectToDb();

        const roleQuery = request.nextUrl.searchParams.get("role");
        const query = roleQuery ? { role: sanitizeRole(roleQuery) } : {};

        const users = await User.find(query).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            users: users.map((user) => ({
                id: user._id.toString(),
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
            })),
        });
    } catch (error) {
        console.error("Users list error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const username = normalizeUsername(
            String(body?.username ?? body?.name ?? "")
        );
        const password = String(body?.password ?? "");

        if (!username || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Username and password are required",
                },
                { status: 400 }
            );
        }

        await connectToDb();

        const userCount = await User.countDocuments();
        const currentUser = getAuthUser(request);

        if (userCount > 0) {
            if (!currentUser) {
                return NextResponse.json(
                    { success: false, message: "Unauthorized" },
                    { status: 401 }
                );
            }

            if (currentUser.role !== "admin") {
                return NextResponse.json(
                    { success: false, message: "Forbidden" },
                    { status: 403 }
                );
            }
        }

        const requestedRole = sanitizeRole(body?.role);
        const role = userCount === 0 ? "admin" : requestedRole;

        if (userCount === 0 && role !== "admin") {
            return NextResponse.json(
                { success: false, message: "The first user must be an admin" },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Username already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
        });

        return NextResponse.json(
            {
                success: true,
                message: "User created successfully",
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to create user" },
            { status: 500 }
        );
    }
}