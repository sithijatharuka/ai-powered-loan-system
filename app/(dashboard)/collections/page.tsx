"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Collections() {
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
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

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.includes(search),
  );

  async function handlePayment(customerId: string) {
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    const response = await fetch(`/api/customers/${customerId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: paymentAmount,
        date: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      setAmount("");
      void loadCustomers();
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>

        <Input
          placeholder="Search customer..."
          className="w-80"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            void loadCustomers(value);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-zinc-500"
                >
                  Loading collections...
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>#{c.id}</TableCell>

                  <TableCell className="font-medium">{c.name}</TableCell>

                  <TableCell>{c.contact}</TableCell>

                  <TableCell>
                    <Badge variant="destructive">
                      Rs.{" "}
                      {(c.totalWithInterest - c.paidAmount).toLocaleString()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    {/* PAYMENT DIALOG */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">Add Payment</Button>
                      </DialogTrigger>

                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Payment for {c.name}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />

                          <Button
                            className="w-full"
                            onClick={() => handlePayment(c.id)}
                          >
                            Save Payment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
