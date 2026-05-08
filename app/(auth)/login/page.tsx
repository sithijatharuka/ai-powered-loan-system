"use client";

import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-xl border-zinc-200">
        {/* Header */}
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">LoanFlow</CardTitle>

          <CardDescription>Login to access your dashboard</CardDescription>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>

            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              className="h-12 rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="h-12 rounded-xl pr-12"
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>

          {/* Login Button */}
          <Button className="w-full h-12 rounded-xl text-base font-semibold">
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
