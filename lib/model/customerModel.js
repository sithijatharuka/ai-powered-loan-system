import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "Payment received" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
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
  },
  { timestamps: true }
);

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;