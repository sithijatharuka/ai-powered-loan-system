import {
  calculatePaymentInterestProfit,
  calculateRemainingBalance,
  determineLoanStatus,
} from "@/lib/calculations";

// computeDashboardSummary
// Computes all dashboard summary metrics from an array of customer records.
// Parameters:
// - customers: array of customer documents (lean results)
// - nowMs (optional): epoch ms used to determine "current month" boundaries (defaults to Date.now())
// Returns an object with the following fields:
// - totalLoanGiven: total of all `loanAmount` across customers
// - totalCollected: total of all `paidAmount` across customers
// - pendingLoan: sum of remaining balances (clamped >= 0)
// - activeCustomers: count of customers with remaining > 0
// - collectedLast7Days: sum of payments in last 7 days
// - collectedLast30Days: sum of payments in last 30 days
// - profitFromLoanInterest: total profit across all payments
// - monthlyProfit: profit from payments in the current month
// - monthlyCollected: collected amount in the current month
// - monthlyLoanGiven: sum of loan amounts for loans opened in the current month
// - totalCustomers: count of customers
// - monthName: localized month name for the current month window
// - recentTransactions: array of recent transactions (most recent first), each with customerId, customerName, amount, date, note, loanStatus, remaining
export function computeDashboardSummary(customers, nowMs = Date.now()) {
  const startOfMonth = new Date(nowMs);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthStartTs = startOfMonth.getTime();

  const now = nowMs;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  let totalLoanGiven = 0;
  let totalCollected = 0;
  let pendingLoan = 0;
  let activeCustomers = 0;
  const transactions = [];
  let profitFromLoanInterest = 0;
  let monthlyProfit = 0;
  let monthlyCollected = 0;
  let monthlyLoanGiven = 0;
  let collectedLast30Days = 0;
  let collectedLast7Days = 0;

  for (const customer of customers) {
    const remaining = calculateRemainingBalance(
      customer.totalWithInterest,
      customer.paidAmount,
    );

    totalLoanGiven += Number(customer.loanAmount || 0);
    totalCollected += Number(customer.paidAmount || 0);
    pendingLoan += remaining;

    if (remaining > 0) {
      activeCustomers += 1;
    }

    // monthlyLoanGiven is based on when the loan was granted. The original
    // implementation used `createdAt`. Preserve that semantics here but prefer
    // `loanStartDate`/`openedAt` if callers change this later.
    const createdTs = new Date(customer.createdAt).getTime();
    if (!Number.isNaN(createdTs) && createdTs >= monthStartTs) {
      monthlyLoanGiven += Number(customer.loanAmount || 0);
    }

    const interestRate = Number(customer.interestRate || 0);

    // include current loan transactions
    for (const transaction of customer.transactions ?? []) {
      const transactionDate = new Date(transaction.date).getTime();

      if (Number.isNaN(transactionDate)) {
        continue;
      }

      const paymentAmount = Number(transaction.amount || 0);
      // Profit for this payment: uses loan's interest rate. Note: this derives
      // the interest portion from the payment amount. For multi-month loans,
      // callers may want to pass loan duration to improve accuracy.
      const profit = calculatePaymentInterestProfit(paymentAmount, interestRate);

      const entry = {
        customerId: String(customer.customerId ?? ""),
        customerName: String(customer.name ?? "Unknown"),
        amount: paymentAmount,
        date: new Date(transaction.date).toISOString(),
        note: transaction.note,
        loanStatus: determineLoanStatus(remaining),
        remaining,
      };

      transactions.push(entry);
      profitFromLoanInterest += profit;

      if (transactionDate >= monthStartTs) {
        monthlyCollected += paymentAmount;
      }

      if (transactionDate >= thirtyDaysAgo) {
        collectedLast30Days += paymentAmount;
      }

      if (transactionDate >= sevenDaysAgo) {
        collectedLast7Days += paymentAmount;
      }

      if (transactionDate >= monthStartTs) {
        monthlyProfit += profit;
      }
    }

    // include loanHistory transactions as historical loans
    for (const loan of customer.loanHistory ?? []) {
      for (const transaction of loan.transactions ?? []) {
        const transactionDate = new Date(transaction.date).getTime();

        if (Number.isNaN(transactionDate)) {
          continue;
        }

        const paymentAmount = Number(transaction.amount || 0);
        const profit = calculatePaymentInterestProfit(paymentAmount, interestRate);

        const entry = {
          customerId: String(customer.customerId ?? ""),
          customerName: String(customer.name ?? "Unknown"),
          amount: paymentAmount,
          date: new Date(transaction.date).toISOString(),
          note: transaction.note,
          loanStatus: loan.status ?? determineLoanStatus(
            calculateRemainingBalance(loan.totalWithInterest, loan.paidAmount),
          ),
          remaining: calculateRemainingBalance(loan.totalWithInterest, loan.paidAmount),
        };

        transactions.push(entry);
        profitFromLoanInterest += profit;

        if (transactionDate >= monthStartTs) {
          monthlyCollected += paymentAmount;
        }

        if (transactionDate >= thirtyDaysAgo) {
          collectedLast30Days += paymentAmount;
        }

        if (transactionDate >= sevenDaysAgo) {
          collectedLast7Days += paymentAmount;
        }

        if (transactionDate >= monthStartTs) {
          monthlyProfit += profit;
        }
      }
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalLoanGiven,
    totalCollected,
    pendingLoan,
    activeCustomers,
    collectedLast7Days,
    collectedLast30Days,
    profitFromLoanInterest,
    monthlyProfit,
    monthlyCollected,
    monthlyLoanGiven,
    totalCustomers: customers.length,
    monthName: startOfMonth.toLocaleString(undefined, { month: "long" }),
    recentTransactions: transactions.slice(0, 5),
  };
}
