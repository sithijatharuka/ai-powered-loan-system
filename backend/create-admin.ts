import "dotenv/config";

import { connectDB } from "@/db/connection";

import { User } from "@/db/models/user.model";

import { hashPassword } from "@/backend/utils/hash";

async function createAdmin() {
  try {
    await connectDB();

    const existingAdmin =
      await User.findOne({
        name: "Admin",
      });

    if (existingAdmin) {
      console.log(
        "Admin already exists"
      );

      process.exit();
    }

    const hashedPassword =
      await hashPassword("123456");

    await User.create({
      name: "Admin",

      password: hashedPassword,

      role: "admin",
    });

    console.log(
      "Admin created successfully"
    );

    process.exit();
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
}

createAdmin();