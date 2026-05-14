"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "./ui/badge";

export default function AddCustomerDialog({
  onCustomerSaved,
}: {
  onCustomerSaved?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    loanAmount: "",
    interestRate: "",
    duration: "",
  });

  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nextCustomerId, setNextCustomerId] = useState<number | null>(null);
  const [loadingNextCustomerId, setLoadingNextCustomerId] = useState(false);
  const [contactError, setContactError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.name === "contact" && contactError) {
      setContactError("");
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function isValidPhoneNumber(value: string) {
    const normalized = value.trim().replace(/[\s()-]/g, "");
    return /^(?:0[0-9]{9}|\+94[0-9]{9})$/.test(normalized);
  }

  async function loadNextCustomerId() {
    setLoadingNextCustomerId(true);

    try {
      const response = await fetch("/api/customers/next-id");
      const data = await response.json();

      if (!response.ok || !data.success) {
        setNextCustomerId(null);
        return;
      }

      setNextCustomerId(Number(data.nextCustomerId));
    } catch {
      setNextCustomerId(null);
    } finally {
      setLoadingNextCustomerId(false);
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      void loadNextCustomerId();
    }
  }, [dialogOpen]);

  // CALCULATIONS

  const loan = Number(formData.loanAmount || 0);
  const monthlyRate = Number(formData.interestRate || 0); // 8
  const duration = Number(formData.duration || 0); // 2 months

  // Total Interest = Principal * (Monthly Rate / 100) * Number of Months
  const totalInterest = loan * (monthlyRate / 100) * duration;

  const totalWithInterest = loan + totalInterest;

  // Monthly and Daily payments
  const monthlyPayment = duration > 0 ? totalWithInterest / duration : 0;
  const dailyPayment = duration > 0 ? totalWithInterest / (duration * 30) : 0;

  async function handleSubmit() {
    const contactValue = formData.contact.trim();

    if (!isValidPhoneNumber(contactValue)) {
      setContactError("Invalid Sri Lankan phone number");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contact: contactValue,
          loanAmount: loan,
          interestRate: monthlyRate,
          duration,
          totalWithInterest,
          monthlyPayment,
          dailyPayment,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data.message || "Failed to save customer. Please try again.",
        );
        return;
      }

      toast.success("Customer saved successfully!");
      onCustomerSaved?.();
      await loadNextCustomerId();
      setFormData({
        name: "",
        contact: "",
        address: "",
        loanAmount: "",
        interestRate: "",
        duration: "",
      });
        setContactError("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save customer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setFormData({
            name: "",
            contact: "",
            address: "",
            loanAmount: "",
            interestRate: "",
            duration: "",
          });
          setContactError("");
        }
      }}
    >
      {/* Open Button */}
      <DialogTrigger asChild>
        <Button type="button" className="rounded-xl cursor-pointer">
          Add Customer
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="rounded-2xl sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <Badge className="rounded-full p-3 bg-blue-50 text-blue-600 border border-blue-200">
            Customer #{loadingNextCustomerId ? "..." : (nextCustomerId ?? "-")}
          </Badge>
        </DialogHeader>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input name="name" value={formData.name} onChange={handleChange} />
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="Enter phone number"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              aria-invalid={Boolean(contactError)}
            />
            {contactError ? (
              <p className="text-xs text-red-600">{contactError}</p>
            ) : null}
          </div>

          {/* Address */}
          <div className="space-y-2 col-span-2">
            <Label>Address</Label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Loan */}
          <div className="space-y-2">
            <Label>Loan Amount</Label>
            <Input
              type="number"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleChange}
            />
          </div>

          {/* Interest */}
          <div className="space-y-2">
            <Label>Monthly Interest %</Label>
            <Input
              type="number"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration (Months)</Label>
            <Input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* CALCULATION PREVIEW */}
        <div className="p-4 bg-zinc-50 rounded-xl space-y-1 text-sm border">
          <p>
            Total Amount: <b>Rs. {totalWithInterest.toLocaleString()}</b>
          </p>

          <p>
            Monthly Payment: <b>Rs. {monthlyPayment.toFixed(2)}</b>
          </p>

          <p>
            Daily Payment: <b>Rs. {dailyPayment.toFixed(2)}</b>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl cursor-pointer"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
