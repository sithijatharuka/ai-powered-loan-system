"use client";

import { useEffect, useState } from "react";
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

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  async function loadCustomers(searchTerm = search) {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/customers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`,
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        setCustomers([]);
        return;
      }

      setCustomers(data.customers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Title */}
        <h1 className="text-2xl font-bold">Customers</h1>

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
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                void loadCustomers(value);
              }}
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          {/* Add Customer Button */}
          <AddCustomerDialog onCustomerSaved={() => void loadCustomers()} />
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-zinc-500"
                >
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <TableRow key={c.id} className="hover:bg-zinc-50 transition">
                  <TableCell className="font-medium">#{c.id}</TableCell>

                  <TableCell>{c.name}</TableCell>

                  <TableCell>{c.contact}</TableCell>

                  <TableCell>{c.address}</TableCell>

                  <TableCell>
                    Rs. {Number(c.loanAmount).toLocaleString()}
                  </TableCell>

                  <TableCell>{c.interestRate}%</TableCell>

                  <TableCell>{c.duration} months</TableCell>

                  <TableCell className="text-right">
                    <Link href={`/customers/${c.id}`}>
                      <Button size="lg" className="rounded-lg cursor-pointer">
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
