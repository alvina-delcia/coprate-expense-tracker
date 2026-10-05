// Optional helper script to populate the database with demo data.
// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Expense = require("../models/Expense");

const categories = [
  "Travel",
  "Food",
  "Office Supplies",
  "Accommodation",
  "Software",
  "Client Entertainment",
  "Training",
  "Other",
];

const run = async () => {
  await connectDB();

  await User.deleteMany();
  await Expense.deleteMany();

  const admin = await User.create({
    name: "Ava Administrator",
    email: "admin@company.com",
    password: "password123",
    role: "admin",
    department: "Operations",
  });

  const manager = await User.create({
    name: "Marcus Manager",
    email: "manager@company.com",
    password: "password123",
    role: "manager",
    department: "Sales",
  });

  const employees = await User.insertMany([
    {
      name: "Elena Employee",
      email: "elena@company.com",
      password: "password123",
      role: "employee",
      department: "Sales",
    },
    {
      name: "James Employee",
      email: "james@company.com",
      password: "password123",
      role: "employee",
      department: "Marketing",
    },
  ]);
  // insertMany skips the pre-save hash hook in some mongoose setups when
  // using raw insertMany with schema middleware that isn't `create`,
  // so re-save each to guarantee password hashing.
  for (const emp of employees) {
    emp.password = "password123";
    await emp.save();
  }

  const allUsers = [manager, ...employees];
  const statuses = ["pending", "approved", "rejected"];
  const expenses = [];

  for (let i = 0; i < 40; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const monthsAgo = Math.floor(Math.random() * 12);
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.floor(Math.random() * 27) + 1);

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    expenses.push({
      user: user._id,
      amount: Math.floor(Math.random() * 900) + 20,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Sample expense entry #${i + 1}`,
      date,
      status,
      managerComment: status !== "pending" ? "Reviewed during demo seed" : "",
      reviewedBy: status !== "pending" ? manager._id : null,
      reviewedAt: status !== "pending" ? new Date() : null,
    });
  }

  await Expense.insertMany(expenses);

  console.log("Seed complete. Demo accounts (password: password123):");
  console.log("  Admin:    admin@company.com");
  console.log("  Manager:  manager@company.com");
  console.log("  Employee: elena@company.com / james@company.com");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
