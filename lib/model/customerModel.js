import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "Payment received" },
  },
  { _id: false },
);

const loanSchema = new mongoose.Schema(
  {
    loanAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    totalWithInterest: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    dailyPayment: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
    },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    contact: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      match: /^0\d{9}$/,
    },
    address: { type: String, required: true, trim: true },
    loanAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    totalWithInterest: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    dailyPayment: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    loanHistory: {
      type: [loanSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;
