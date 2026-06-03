"use client";

import { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  async function loadCustomers(
    searchTerm = search,
    fetchOnlyWithTransactions = false,
  ) {
    setLoading(true);

    try {
      // Do not fetch all customers by default (avoid listing everyone).
      if (!searchTerm && !fetchOnlyWithTransactions) {
        setCustomers([]);
        return;
      }

      const response = await fetch(
        `/api/customers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`,
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        setCustomers([]);
        return;
      }

      let fetched = data.customers ?? [];

      if (fetchOnlyWithTransactions || !searchTerm) {
        fetched = fetched.filter((c: any) => {
          const hasCurrentTx = Array.isArray(c.transactions) && c.transactions.length > 0;
          const hasHistoryTx = Array.isArray(c.loanHistory) &&
            c.loanHistory.some((l: any) => Array.isArray(l.transactions) && l.transactions.length > 0);

          return hasCurrentTx || hasHistoryTx;
        });
      }

      setCustomers(fetched);
    } finally {
      setLoading(false);
    }
  }

  // Load customers who have transactions on mount so collection records
  // with payments are always shown in the table by default.
  useEffect(() => {
    void loadCustomers("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toLocalDateKey(value: string | Date | number | null | undefined) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

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

    const transactionDateKeys = [] as string[];

    if (Array.isArray(c.transactions)) {
      transactionDateKeys.push(
        ...c.transactions.map((t: any) => toLocalDateKey(t?.date)).filter((d: string) => d !== ""),
      );
    }

    if (Array.isArray(c.loanHistory)) {
      c.loanHistory.forEach((loan: any) => {
        if (Array.isArray(loan.transactions)) {
          transactionDateKeys.push(
            ...loan.transactions.map((t: any) => toLocalDateKey(t?.date)).filter((d: string) => d !== ""),
          );
        }
      });
    }

    if (transactionDateKeys.length === 0) {
      return false;
    }

    if (dateFilter === "today") {
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");

      return transactionDateKeys.some((dateKey: string) => dateKey === today);
    }

    if (dateFilter === "last7days") {
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoDateOnly =
        sevenDaysAgo.getFullYear() +
        "-" +
        String(sevenDaysAgo.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(sevenDaysAgo.getDate()).padStart(2, "0");

      return transactionDateKeys.some(
        (dateKey: string) =>
          dateKey >= sevenDaysAgoDateOnly && dateKey <= today,
      );
    }

    if (dateFilter === "custom") {
      if (customStartDate === "" && customEndDate === "") {
        return false;
      }

      return transactionDateKeys.some((dateKey: string) => {
        if (customStartDate && dateKey < customStartDate) {
          return false;
        }

        if (customEndDate && dateKey > customEndDate) {
          return false;
        }

        return true;
      });
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
      void loadCustomers(search, true);
    }
  }

  // Header dialog states
  const [dialogSearchId, setDialogSearchId] = useState("");
  const [dialogCustomer, setDialogCustomer] = useState<any | null>(null);
  const [dialogDate, setDialogDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dialogLoading, setDialogLoading] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [dialogSubmitLoading, setDialogSubmitLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [editTransactionIndex, setEditTransactionIndex] = useState<number>(-1);
  const [editLoading, setEditLoading] = useState(false);

  const formatCollectionId = (id: number | string | null | undefined) => {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return "-";
    }

    return `C${String(numericId).padStart(2, "0")}`;
  };

  const formatSeqId = (seq: number) => String(seq).padStart(2, "0");

  async function searchCustomerByIdOrPhone() {
    const identifier = dialogSearchId.trim();

    if (!identifier) {
      setDialogCustomer(null);
      return;
    }

    setDialogLoading(true);
    try {
      const resp = await fetch(
        `/api/customers?identifier=${encodeURIComponent(identifier)}`,
      );
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

    setDialogSubmitLoading(true);
    try {
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
        setDialogDate(new Date().toISOString().slice(0, 10));
        setAddPaymentDialogOpen(false);
        void loadCustomers(search, true);
      }
    } finally {
      setDialogSubmitLoading(false);
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

  // Open edit dialog for a specific transaction index
  function openEditDialogForIndex(customer: any, txIndex: number) {
    const transactions = Array.isArray(customer.transactions)
      ? customer.transactions
      : [];

    if (
      transactions.length === 0 ||
      txIndex < 0 ||
      txIndex >= transactions.length
    ) {
      return;
    }

    const tx = transactions[txIndex];
    setEditingCustomer(customer);
    setEditTransactionIndex(txIndex);
    setEditAmount(String(tx.amount ?? ""));
    setEditDate(
      tx.date
        ? new Date(tx.date).toISOString().slice(0, 10)
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
        void loadCustomers(search, true);
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
    <div className="p-3 sm:p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Collections</h1>

        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center w-full lg:w-auto">
          <Input
            placeholder="Search by ID or customer..."
            className="w-full lg:w-80 text-xs sm:text-sm h-9 sm:h-10"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              void loadCustomers(value);
            }}
          />

          <select
            className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm w-full lg:w-auto"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 days</option>
            <option value="custom">Custom date range</option>
          </select>

          {dateFilter === "custom" ? (
            <div className="flex flex-col gap-2 sm:flex-row w-full lg:w-auto">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10 flex-1 lg:flex-none"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10 flex-1 lg:flex-none"
              />
            </div>
          ) : null}

          {/* Global Add Payment Dialog Trigger */}
          <Dialog
            open={addPaymentDialogOpen}
            onOpenChange={(open) => {
              setAddPaymentDialogOpen(open);
              if (!open) {
                setDialogSearchId("");
                setDialogCustomer(null);
                setAmount("");
                setDialogDate(new Date().toISOString().slice(0, 10));
                setDialogLoading(false);
                setDialogSubmitLoading(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full lg:w-auto text-xs sm:text-sm h-9 sm:h-10">
                Add Payment
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl w-full sm:w-96">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  Add Payment
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter customer ID or phone"
                    value={dialogSearchId}
                    onChange={(e) => setDialogSearchId(e.target.value)}
                    className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                  />
                  <Button
                    onClick={searchCustomerByIdOrPhone}
                    disabled={dialogLoading}
                    className="text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto"
                  >
                    {dialogLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {dialogCustomer ? (
                  <div className="rounded-md border p-3">
                    <div className="font-medium text-sm">
                      {dialogCustomer.name}
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-600">
                      Available balance: Rs.{" "}
                      {(
                        dialogCustomer.totalWithInterest -
                        dialogCustomer.paidAmount
                      ).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  dialogSearchId && (
                    <div className="text-xs sm:text-sm text-zinc-500">
                      No customer found
                    </div>
                  )
                )}

                <div>
                  <label className="text-xs sm:text-sm">Date</label>
                  <Input
                    type="date"
                    value={dialogDate}
                    onChange={(e) => setDialogDate(e.target.value)}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>

                <Button
                  className="w-full text-xs sm:text-sm h-9 sm:h-10"
                  onClick={submitDialogPayment}
                  disabled={dialogSubmitLoading}
                >
                  {dialogSubmitLoading ? "Submitting..." : "Submit Payment"}
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
        <DialogContent className="rounded-2xl w-full sm:w-96">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Edit Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="font-medium text-sm">
                {editingCustomer ? editingCustomer.name : "Customer"}
              </div>
              <div className="text-xs sm:text-sm text-zinc-600">
                Customer ID: {formatCollectionId(editingCustomer?.id)}
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 mt-1">
                Current remaining balance: Rs.{" "}
                {editRemainingBalance.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm">Date</label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>

            <div>
              <Input
                type="number"
                placeholder="Enter corrected amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>

            <Button
              className="w-full text-xs sm:text-sm h-9 sm:h-10"
              onClick={submitEditPayment}
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">
                Collection ID
              </TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                Name
              </TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                Total Collected
              </TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                Date
              </TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">
                Status
              </TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-zinc-500 text-xs sm:text-sm"
                >
                  Loading collections...
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                // Flatten all transactions across filtered customers into a single list
                const entries: Array<any> = [];
                filtered.forEach((cust) => {
                  const transactions = Array.isArray(cust.transactions)
                    ? cust.transactions
                    : [];

                  // current loan transactions
                  transactions.forEach((t: any, idx: number) => {
                    entries.push({ customer: cust, tx: t, txIndex: idx, source: "current" });
                  });

                  // include transactions from historical/completed loans
                  const loanHistory = Array.isArray(cust.loanHistory) ? cust.loanHistory : [];
                  loanHistory.forEach((loan: any, loanIdx: number) => {
                    const histTx = Array.isArray(loan.transactions) ? loan.transactions : [];
                    histTx.forEach((t: any, txIdx: number) => {
                      entries.push({
                        customer: cust,
                        tx: t,
                        txIndex: txIdx,
                        source: "history",
                        historyLoanIndex: loanIdx,
                      });
                    });
                  });
                });

                if (entries.length === 0) {
                  const getLatestTimestamp = (cust: any) => {
                    const txTimes: number[] = [];
                    if (Array.isArray(cust.transactions)) {
                      txTimes.push(...cust.transactions.map((t: any) => {
                        const d = new Date(t?.date);
                        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
                      }));
                    }

                    if (Array.isArray(cust.loanHistory)) {
                      cust.loanHistory.forEach((loan: any) => {
                        if (Array.isArray(loan.transactions)) {
                          txTimes.push(...loan.transactions.map((t: any) => {
                            const d = new Date(t?.date);
                            return Number.isNaN(d.getTime()) ? 0 : d.getTime();
                          }));
                        }
                      });
                    }

                    return txTimes.length > 0 ? Math.max(...txTimes) : 0;
                  };

                  const sorted = filtered.slice();

                  return sorted.map((c, idx) => {
                    const seqId = formatSeqId(idx + 1);
                    const totalCollected = Number(
                      c.paidAmount ??
                        (Array.isArray(c.transactions)
                          ? c.transactions.reduce(
                              (sum: number, t: any) =>
                                sum + Number(t.amount || 0),
                              0,
                            )
                          : 0),
                    );

                    // find latest transaction across current and history
                    const allTxDates: number[] = [];
                    if (Array.isArray(c.transactions)) {
                      allTxDates.push(...c.transactions.map((t: any) => {
                        const d = new Date(t?.date);
                        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
                      }));
                    }
                    if (Array.isArray(c.loanHistory)) {
                      c.loanHistory.forEach((loan: any) => {
                        if (Array.isArray(loan.transactions)) {
                          allTxDates.push(...loan.transactions.map((t: any) => {
                            const d = new Date(t?.date);
                            return Number.isNaN(d.getTime()) ? 0 : d.getTime();
                          }));
                        }
                      });
                    }

                    const latestTs = allTxDates.length > 0 ? Math.max(...allTxDates) : 0;
                    const latestDate = latestTs ? toLocalDateKey(new Date(latestTs).toISOString()) : "-";

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{seqId}</TableCell>

                        <TableCell className="font-medium text-xs sm:text-sm">
                          {c.name}
                        </TableCell>

                        <TableCell className="text-xs sm:text-sm">
                          Rs. {totalCollected.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-xs sm:text-sm">
                          {latestDate}
                        </TableCell>

                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                          <Badge
                            variant={
                              c.status === "completed"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {c.status === "completed" ? "Completed" : "Ongoing"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(c)}
                            disabled={
                              !Array.isArray(c.transactions) ||
                              c.transactions.length === 0
                            }
                            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                }

                // Sort entries by transactionId descending (C8 → C7 → C6...)
                entries.sort((a, b) => {
                  const parseId = (tx: any) => {
                    const id = tx?.transactionId ?? "";
                    const num = Number(String(id).replace(/\D+/g, ""));
                    return Number.isFinite(num) ? num : 0;
                  };
                  return parseId(b.tx) - parseId(a.tx);
                });

                return entries.map((entry: any, displayIdx: number) => {
                  const c = entry.customer;
                  const t = entry.tx;
                  const originalIndex = entry.txIndex;
                  const txDate = t?.date ? toLocalDateKey(t.date) : "-";
                  const txAmount = Number(t?.amount || 0);
                  const isHistory = entry.source === "history";
                  const seqId = entries.length - displayIdx;

                  return (
                    <TableRow key={`${c.id}-${entry.source}-${originalIndex}-${displayIdx}`}>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm">C{seqId}</TableCell>
                      

                      <TableCell className="font-medium text-xs sm:text-sm">
                        {c.name}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm">
                        Rs. {txAmount.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm">
                        {txDate}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                        <Badge
                          variant={
                            c.status === "completed" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {c.status === "completed" ? "Completed" : "Ongoing"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            !isHistory && openEditDialogForIndex(c, originalIndex)
                          }
                          disabled={isHistory}
                          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                });
              })()
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
