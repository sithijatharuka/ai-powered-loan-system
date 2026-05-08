import { User } from "@/db/models/user.model";

import { comparePassword } from "@/backend/utils/hash";

import { generateToken } from "@/backend/utils/jwt";

export async function loginUser(
  email: string,
  password: string
) {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordCorrect =
    await comparePassword(
      password,
      user.password
    );

  if (!isPasswordCorrect) {
    throw new Error("Invalid password");
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  return {
    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}