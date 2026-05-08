"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";

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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleAddOfficer() {
    const newOfficer = {
      id: officers.length + 1,
      ...formData,
      status: "Active",
    };

    setOfficers([...officers, newOfficer]);

    setFormData({
      name: "",
      email: "",
      phone: "",
      area: "",
    });
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

          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Collection Officer</DialogTitle>
            </DialogHeader>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 py-4">
              {/* NAME */}
              <div className="space-y-2">
                <Label>Officer Name</Label>

                <Input
                  name="name"
                  placeholder="Enter officer name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <Label>Email</Label>

                <Input
                  name="email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label>Phone Number</Label>

                <Input
                  name="phone"
                  placeholder="0771234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* AREA */}
              <div className="space-y-2">
                <Label>Collection Area</Label>

                <Input
                  name="area"
                  placeholder="Colombo"
                  value={formData.area}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end">
              <Button onClick={handleAddOfficer} className="rounded-xl">
                Save Officer
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

                  <TableHead>Email</TableHead>

                  <TableHead>Phone</TableHead>

                  <TableHead>Area</TableHead>

                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                {officers.map((officer) => (
                  <TableRow key={officer.id}>
                    <TableCell className="font-medium">#{officer.id}</TableCell>

                    <TableCell>{officer.name}</TableCell>

                    <TableCell>{officer.email}</TableCell>

                    <TableCell>{officer.phone}</TableCell>

                    <TableCell>{officer.area}</TableCell>

                    <TableCell>
                      <Badge className="rounded-lg">{officer.status}</Badge>
                    </TableCell>
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
