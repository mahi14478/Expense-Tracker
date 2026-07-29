import Transaction from "../models/Transaction.js";

// Add transaction
export const addTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date
    } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Type, amount and category are required"
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense"
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: Number(amount),
      category,
      description,
      date: date || new Date()
    });

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction
    });
  } catch (error) {
    console.error("Add Transaction Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding transaction"
    });
  }
};

// Get user's transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id
    }).sort({ date: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions"
    });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Transaction deleted successfully"
    });
  } catch (error) {
    console.error("Delete Transaction Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting transaction"
    });
  }
};

// Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date
    } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        type,
        amount,
        category,
        description,
        date
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Transaction updated successfully",
      transaction
    });
  } catch (error) {
    console.error("Update Transaction Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating transaction"
    });
  }
};