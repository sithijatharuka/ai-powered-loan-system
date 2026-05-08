"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

export default function AddCustomerDialog() {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
    loanAmount: "",
    interestRate: "",
    duration: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit() {
    console.log(formData);

    // later:
    // save to mongodb
    // call server action
    // reset form
  }

  return (
    <Dialog>

      {/* Open Button */}
      <DialogTrigger asChild>
        <Button className="rounded-xl cursor-pointer">
          Add Customer
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="sm:max-w-[600px] rounded-2xl">

        <DialogHeader>
          <DialogTitle>
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 py-4">

          {/* Name */}
          <div className="space-y-2">
            <Label>Customer Name</Label>

            <Input
              name="name"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label>Contact Number</Label>

            <Input
              name="contact"
              placeholder="0771234567"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="space-y-2 col-span-2">
            <Label>Address</Label>

            <Input
              name="address"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Loan Amount */}
          <div className="space-y-2">
            <Label>Loan Amount</Label>

            <Input
              type="number"
              name="loanAmount"
              placeholder="50000"
              value={formData.loanAmount}
              onChange={handleChange}
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label>Interest Rate (%)</Label>

            <Input
              type="number"
              name="interestRate"
              placeholder="12"
              value={formData.interestRate}
              onChange={handleChange}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Loan Duration (Months)</Label>

            <Input
              type="number"
              name="duration"
              placeholder="12"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <Button
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