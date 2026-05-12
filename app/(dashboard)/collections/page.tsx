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
      String(c.id).includes(search) ||
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

  // Header dialog states
  const [dialogSearchId, setDialogSearchId] = useState("");
  const [dialogCustomer, setDialogCustomer] = useState<any | null>(null);
  const [dialogDate, setDialogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dialogLoading, setDialogLoading] = useState(false);

  async function searchCustomerById() {
    const customerId = Number(dialogSearchId.trim());
    if (!Number.isInteger(customerId) || customerId <= 0) {
      setDialogCustomer(null);
      return;
    }

    setDialogLoading(true);
    try {
      const resp = await fetch(`/api/customers?customerId=${customerId}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setDialogCustomer(null);
        return;
      }

      const found = Array.isArray(data.customers) && data.customers.length > 0 ? data.customers[0] : null;
      setDialogCustomer(found);
    } finally {
      setDialogLoading(false);
    }
  }

  async function submitDialogPayment() {
    if (!dialogCustomer) return;

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return;

    const response = await fetch(`/api/customers/${dialogCustomer.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: paymentAmount, date: new Date(dialogDate).toISOString() }),
    });

    if (response.ok) {
      setAmount("");
      setDialogCustomer(null);
      setDialogSearchId("");
      void loadCustomers();
      // close handled by Dialog uncontrolled trigger; user can close manually
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by ID or customer..."
            className="w-80"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              void loadCustomers(value);
            }}
          />

          {/* Global Add Payment Dialog Trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Payment</Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Payment</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter customer ID"
                    value={dialogSearchId}
                    onChange={(e) => setDialogSearchId(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={searchCustomerById} disabled={dialogLoading}>
                    {dialogLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {dialogCustomer ? (
                  <div className="p-2 border rounded">
                    <div className="font-medium">{dialogCustomer.name}</div>
                    <div className="text-sm text-zinc-600">
                      Available balance: Rs. {(dialogCustomer.totalWithInterest - dialogCustomer.paidAmount).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  dialogSearchId && (
                    <div className="text-sm text-zinc-500">No customer found</div>
                  )
                )}

                <div>
                  <label className="text-sm">Date</label>
                  <Input type="date" value={dialogDate} onChange={(e) => setDialogDate(e.target.value)} />
                </div>

                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={submitDialogPayment}>
                  Submit Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                    {/* Removed per-row Add Payment button — use header button */}
                    <span className="text-zinc-500">—</span>
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
