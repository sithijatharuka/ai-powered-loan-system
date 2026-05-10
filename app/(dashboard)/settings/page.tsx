"use client";

import { useState } from "react";

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

const initialOfficers = [
  {
    id: 1,
    name: "Saman Kumara",
    email: "saman@gmail.com",
    phone: "0771234567",
    area: "Colombo",
    status: "Active",
  },
  {
    id: 2,
    name: "Kasun Silva",
    email: "kasun@gmail.com",
    phone: "0712345678",
    area: "Kandy",
    status: "Active",
  },
];

export default function Settings() {
  const [officers, setOfficers] = useState(initialOfficers);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    password: "",
  });

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

      const newOfficer = {
        id: officers.length + 1,
        name: data.user.username,
        email: formData.email,
        phone: formData.phone,
        area: formData.area,
        status: "Active",
      };

      setOfficers([...officers, newOfficer]);

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

                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                {officers.map((officer) => (
                  <TableRow key={officer.id}>
                    <TableCell className="font-medium">#{officer.id}</TableCell>

                    <TableCell>{officer.name}</TableCell>

                    <TableCell>{officer.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
