"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddCustomerDialog from "@/components/AddCustomerDialog";

const initialCustomers = [
  {
    id: 1,
    name: "Kamal Perera",
    contact: "0771234567",
    address: "Colombo",
    loanAmount: 50000,
    interestRate: 12,
    duration: "12 months",
  },
  {
    id: 2,
    name: "Nimal Silva",
    contact: "0712345678",
    address: "Kandy",
    loanAmount: 75000,
    interestRate: 10,
    duration: "6 months",
  },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filteredCustomers = initialCustomers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">

        {/* Title */}
        <h1 className="text-2xl font-bold">
          Customers
        </h1>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <Input
              type="text"
              placeholder="Search by name, contact, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          {/* Add Customer Button */}
          <AddCustomerDialog />

        </div>

      </div>
      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>

          {/* Table Header */}
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-zinc-50 transition"
                >
                  <TableCell className="font-medium">
                    #{c.id}
                  </TableCell>

                  <TableCell>{c.name}</TableCell>

                  <TableCell>{c.contact}</TableCell>

                  <TableCell>{c.address}</TableCell>

                  <TableCell>
                    Rs. {c.loanAmount.toLocaleString()}
                  </TableCell>

                  <TableCell>{c.interestRate}%</TableCell>

                  <TableCell>{c.duration}</TableCell>

                  <TableCell className="text-right">
                    <Link href={`/customers/${c.id}`}>
                      <Button
                        size="lg"
                        className="rounded-lg cursor-pointer"
                      >
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-zinc-500"
                >
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
      </div>
    </div>
  );
}