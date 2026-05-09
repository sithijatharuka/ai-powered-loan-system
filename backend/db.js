import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!mongoose.connection.readyState) {
  // Connect to MongoDB and explicitly set the database name
  mongoose.connect(MONGODB_URI, { dbName: "loan-system" });
}

const customerSchema = new mongoose.Schema({
  name: String,
  contact: String,
  address: String,
  loanAmount: Number,
  interestRate: Number,
  duration: Number,
  totalWithInterest: Number,
  monthlyPayment: Number,
  dailyPayment: Number,
  createdAt: { type: Date, default: Date.now },
});

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export async function addCustomer(data) {
  const {
    name,
    contact,
    address,
    loanAmount,
    interestRate,
    duration,
    totalWithInterest,
    monthlyPayment,
    dailyPayment,
  } = data;

  const customer = await Customer.create({
    name,
    contact,
    address,
    loanAmount: Number(loanAmount),
    interestRate: Number(interestRate),
    duration: Number(duration),
    totalWithInterest,
    monthlyPayment,
    dailyPayment,
  });

  return customer;
}
