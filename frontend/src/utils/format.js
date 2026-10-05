// Shared formatting helpers used across pages so numbers, dates and IDs
// look consistent everywhere in the app.

// Indian Rupee formatting (Indian digit grouping, e.g. ₹1,24,500).
export const currency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const shortDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

export const fullDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Derives a human-friendly, stable "EXP-XXXX" style ID from a Mongo
// ObjectId without requiring a backend schema change — the same _id
// always maps to the same display ID everywhere it's shown.
export const expenseDisplayId = (mongoId) => {
  if (!mongoId) return "EXP-0000";
  const numeric = parseInt(mongoId.slice(-6), 16) % 100000;
  return `EXP-${(1000 + numeric).toString().slice(-4).padStart(4, "0")}`;
};

export const categories = [
  "Travel",
  "Food",
  "Office Supplies",
  "Accommodation",
  "Software",
  "Client Entertainment",
  "Training",
  "Other",
];
