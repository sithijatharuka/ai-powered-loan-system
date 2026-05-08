"use client";

import { useState } from "react";

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

export default function AddCustomerDialog() {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    loanAmount: "",
    interestRate: "",
    duration: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

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

  function handleSubmit() {
    console.log({
      ...formData,
      totalWithInterest,
      monthlyPayment,
      dailyPayment,
    });

    // later: save to db
  }

  return (
    <Dialog>
      {/* Open Button */}
      <DialogTrigger asChild>
        <Button type="button" className="rounded-xl cursor-pointer">
          Add Customer
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <Badge className="rounded-full p-3 bg-blue-50 text-blue-600 border border-blue-200">
            Customer #{1}
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
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />
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
          >
            Save Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
