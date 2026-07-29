import express from "express";

import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} from "../controllers/transactionController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all transactions
router.get("/", protect, getTransactions);

// Add transaction
router.post("/", protect, addTransaction);

// Update transaction
router.put("/:id", protect, updateTransaction);

// Delete transaction
router.delete("/:id", protect, deleteTransaction);

export default router;