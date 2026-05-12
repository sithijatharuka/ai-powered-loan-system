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
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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

  const filtered = customers.filter((c) => {
    const matchesSearch =
      String(c.id).includes(search) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.includes(search);

    if (!matchesSearch) {
      return false;
    }

    if (dateFilter === "all") {
      return true;
    }

    const createdAt = new Date(c.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (dateFilter === "today") {
      return createdAt >= startOfToday;
    }

    if (dateFilter === "last7days") {
      const startOfSevenDaysAgo = new Date(startOfToday);
      startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 6);
      return createdAt >= startOfSevenDaysAgo;
    }

    if (dateFilter === "custom") {
      const start = customStartDate
        ? new Date(`${customStartDate}T00:00:00`)
        : null;
      const end = customEndDate
        ? new Date(`${customEndDate}T23:59:59.999`)
        : null;

      if (start && createdAt < start) {
        return false;
      }

      if (end && createdAt > end) {
        return false;
      }

      return true;
    }

    return true;
  });

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
  const [dialogDate, setDialogDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dialogLoading, setDialogLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [editTransactionIndex, setEditTransactionIndex] = useState<number>(-1);
  const [editLoading, setEditLoading] = useState(false);

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

      const found =
        Array.isArray(data.customers) && data.customers.length > 0
          ? data.customers[0]
          : null;
      setDialogCustomer(found);
    } finally {
      setDialogLoading(false);
    }
  }

  async function submitDialogPayment() {
    if (!dialogCustomer) return;

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return;

    const response = await fetch(
      `/api/customers/${dialogCustomer.id}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          date: new Date(dialogDate).toISOString(),
        }),
      },
    );

    if (response.ok) {
      setAmount("");
      setDialogCustomer(null);
      setDialogSearchId("");
      void loadCustomers();
      // close handled by Dialog uncontrolled trigger; user can close manually
    }
  }

  function openEditDialog(customer: any) {
    const transactions = Array.isArray(customer.transactions)
      ? customer.transactions
      : [];

    if (transactions.length === 0) {
      return;
    }

    const latestIndex = transactions.length - 1;
    const latestTransaction = transactions[latestIndex];

    setEditingCustomer(customer);
    setEditTransactionIndex(latestIndex);
    setEditAmount(String(latestTransaction.amount ?? ""));
    setEditDate(
      latestTransaction.date
        ? new Date(latestTransaction.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    );
    setEditDialogOpen(true);
  }

  async function submitEditPayment() {
    if (!editingCustomer) return;

    const paymentAmount = Number(editAmount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return;

    setEditLoading(true);
    try {
      const response = await fetch(
        `/api/customers/${editingCustomer.id}/payments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: paymentAmount,
            date: new Date(editDate).toISOString(),
            transactionIndex: editTransactionIndex,
          }),
        },
      );

      if (response.ok) {
        setEditDialogOpen(false);
        setEditingCustomer(null);
        setEditAmount("");
        setEditDate(new Date().toISOString().slice(0, 10));
        setEditTransactionIndex(-1);
        void loadCustomers();
      }
    } finally {
      setEditLoading(false);
    }
  }

  const editRemainingBalance = editingCustomer
    ? Math.max(
        Number(editingCustomer.totalWithInterest || 0) -
          Number(editingCustomer.paidAmount || 0),
        0,
      )
    : 0;

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            placeholder="Search by ID or customer..."
            className="w-full lg:w-80"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              void loadCustomers(value);
            }}
          />

          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 days</option>
            <option value="custom">Custom date range</option>
          </select>

          {dateFilter === "custom" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          ) : null}

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
                  <div className="rounded-md border p-2">
                    <div className="font-medium">{dialogCustomer.name}</div>
                    <div className="text-sm text-zinc-600">
                      Available balance: Rs.{" "}
                      {(
                        dialogCustomer.totalWithInterest -
                        dialogCustomer.paidAmount
                      ).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  dialogSearchId && (
                    <div className="text-sm text-zinc-500">
                      No customer found
                    </div>
                  )
                )}

                <div>
                  <label className="text-sm">Date</label>
                  <Input
                    type="date"
                    value={dialogDate}
                    onChange={(e) => setDialogDate(e.target.value)}
                  />
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

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingCustomer(null);
            setEditAmount("");
            setEditDate(new Date().toISOString().slice(0, 10));
            setEditTransactionIndex(-1);
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="font-medium">
                {editingCustomer ? editingCustomer.name : "Customer"}
              </div>
              <div className="text-sm text-zinc-600">
                Customer ID: #{editingCustomer?.id ?? "-"}
              </div>
              <div className="text-sm text-zinc-600 mt-1">
                Current remaining balance: Rs. {editRemainingBalance.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-sm">Date</label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                type="number"
                placeholder="Enter corrected amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={submitEditPayment}
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              {/* <TableHead>Balance</TableHead> */}
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

                  {/* <TableCell>
                    <Badge variant="destructive">
                      Rs.{" "}
                      {(c.totalWithInterest - c.paidAmount).toLocaleString()}
                    </Badge>
                  </TableCell> */}

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(c)}
                      disabled={
                        !Array.isArray(c.transactions) ||
                        c.transactions.length === 0
                      }
                    >
                      Edit
                    </Button>
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
