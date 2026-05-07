"use client";

import { useState } from "react";
import tw from "tailwind-styled-components";
import { Eye, EyeOff } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Container>
      <Card>
        <Title>Login</Title>
        <Subtitle>Access your loan dashboard</Subtitle>

        {/* Role Dropdown */}
        <Field>
          <Label>Role</Label>
          <Select>
            <SelectTrigger className="h-12 w-full rounded-xl border border-zinc-200 bg-white text-black">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>

            <SelectContent className="bg-white text-black border border-zinc-200">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="collection-officer">Collection Officer</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {/* Password */}
        <Field>
          <Label>Password</Label>

          <PasswordWrapper>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
            />

            <IconButton
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </IconButton>
          </PasswordWrapper>
        </Field>

        <Button>Sign In</Button>
      </Card>
    </Container>
  );
}

/* ================= STYLE ================= */

const Container = tw.div`
min-h-screen flex items-center justify-center bg-zinc-50
`;

const Card = tw.div`
w-full max-w-md bg-white border border-zinc-200
rounded-3xl shadow-xl p-8 space-y-5
`;

const Title = tw.h1`
text-2xl font-bold text-zinc-900 text-center
`;

const Subtitle = tw.p`
text-sm text-zinc-500 text-center
`;

const Field = tw.div`
space-y-2
`;

const Label = tw.label`
text-sm font-medium text-zinc-700
`;

const PasswordWrapper = tw.div`
relative
`;

const Input = tw.input`
w-full h-12 rounded-xl border border-zinc-200
px-4 pr-12 text-zinc-900
focus:outline-none focus:ring-2 focus:ring-blue-500
`;

const IconButton = tw.button`
absolute right-3 top-1/2 -translate-y-1/2
text-zinc-500 hover:text-zinc-800
`;

const Button = tw.button`
w-full h-12 rounded-xl bg-blue-600 text-white
font-semibold hover:bg-blue-700 transition
`;