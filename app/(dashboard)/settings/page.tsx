"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Officer = {
  id: string;
  username: string;
  role: "admin" | "officer";
  createdAt?: string;
};

export default function Settings() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    password: "",
  });

  async function loadOfficers() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register?role=officer");
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to load officers");
        setOfficers([]);
        return;
      }

      setOfficers((data.users ?? []) as Officer[]);
    } catch {
      toast.error("Failed to load officers");
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOfficers();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleAddOfficer() {
    try {
      setSaving(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.name,
          password: formData.password,
          role: "officer",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to save officer");
        return;
      }

      await loadOfficers();

      setFormData({
        name: "",
        email: "",
        phone: "",
        area: "",
        password: "",
      });

      toast.success("Officer added successfully");
    } catch {
      toast.error("Failed to save officer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>

          <p className="text-sm text-muted-foreground">
            Manage collection officers
          </p>
        </div>

        {/* ADD OFFICER DIALOG */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl">Add Collection Officer</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-112.5 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Collection Officer</DialogTitle>
            </DialogHeader>

            {/* FORM */}
            <div className="grid grid-cols-1 gap-4 py-4">
              {/* NAME */}
              <div className="space-y-2">
                <Label>User Name</Label>

                <Input
                  name="name"
                  placeholder="Enter user name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label>Password</Label>

                <Input
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end">
              <Button
                onClick={handleAddOfficer}
                className="rounded-xl"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Officer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* OFFICERS TABLE */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Collection Officers</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="border rounded-xl overflow-hidden">
            <Table>
              {/* HEADER */}
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>ID</TableHead>

                  <TableHead>Name</TableHead>

                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-zinc-500">
                      Loading officers...
                    </TableCell>
                  </TableRow>
                ) : officers.length > 0 ? (
                  officers.map((officer) => (
                    <TableRow key={officer.id}>
                      <TableCell className="font-medium">#{officer.id.slice(-6)}</TableCell>

                      <TableCell>{officer.username}</TableCell>

                      <TableCell className="capitalize">{officer.role}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-zinc-500">
                      No officers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
