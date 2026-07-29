import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const emptyTransaction = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

function App() {
  // =========================
  // AUTH
  // =========================

  const [isLogin, setIsLogin] = useState(true);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // TRANSACTIONS
  // =========================

  const [transactions, setTransactions] = useState([]);

  const [transactionForm, setTransactionForm] =
    useState(emptyTransaction);

  const [editingId, setEditingId] = useState(null);

  // =========================
  // SEARCH / FILTER / SORT
  // =========================

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // =========================
  // AUTH INPUT
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // LOGIN / REGISTER
  // =========================

  const handleAuth = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/auth/login"
        : "/auth/register";

      const response = await axios.post(
        `${API_URL}${endpoint}`,
        form
      );

      if (response.data.success) {
        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        setToken(response.data.token);
        setUser(response.data.user);

        setMessage(response.data.message);

        setForm({
          name: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET TRANSACTIONS
  // =========================

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTransactions(
          response.data.transactions || []
        );
      }
    } catch (error) {
      console.error(
        "Fetch Transactions Error:",
        error
      );
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  // =========================
  // TRANSACTION INPUT
  // =========================

  const handleTransactionChange = (e) => {
    setTransactionForm({
      ...transactionForm,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // ADD / UPDATE TRANSACTION
  // =========================

  const saveTransaction = async (e) => {
    e.preventDefault();

    setMessage("");

    if (
      !transactionForm.amount ||
      Number(transactionForm.amount) <= 0
    ) {
      setMessage("Please enter a valid amount.");
      return;
    }

    try {
      let response;

      const data = {
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        category: transactionForm.category,
        description: transactionForm.description,
        date: transactionForm.date,
      };

      // UPDATE
      if (editingId) {
        response = await axios.put(
          `${API_URL}/transactions/${editingId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // ADD
      else {
        response = await axios.post(
          `${API_URL}/transactions`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        setMessage(
          editingId
            ? "Transaction updated successfully ✅"
            : "Transaction added successfully ✅"
        );

        setTransactionForm({
          ...emptyTransaction,
          date: new Date()
            .toISOString()
            .split("T")[0],
        });

        setEditingId(null);

        await fetchTransactions();
      }
    } catch (error) {
      console.error(
        "Save Transaction Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to save transaction"
      );
    }
  };

  // =========================
  // EDIT TRANSACTION
  // =========================

  const editTransaction = (transaction) => {
    console.log(
      "Editing transaction:",
      transaction
    );

    setEditingId(transaction._id);

    setTransactionForm({
      type: transaction.type || "expense",
      amount: transaction.amount || "",
      category: transaction.category || "Food",
      description: transaction.description || "",
      date: transaction.date
        ? new Date(transaction.date)
            .toISOString()
            .split("T")[0]
        : new Date()
            .toISOString()
            .split("T")[0],
    });

    setMessage("Editing transaction ✏️");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEdit = () => {
    setEditingId(null);

    setTransactionForm({
      ...emptyTransaction,
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setMessage("");
  };

  // =========================
  // DELETE
  // =========================

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${API_URL}/transactions/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage(
          "Transaction deleted successfully 🗑️"
        );

        await fetchTransactions();
      }
    } catch (error) {
      console.error(
        "Delete Transaction Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to delete transaction"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setTransactions([]);
  };

  // =========================
  // SEARCH / FILTER / SORT
  // =========================

  const filteredTransactions = [...transactions]
    .filter((transaction) => {
      const searchText = search.toLowerCase();

      return (
        transaction.description
          ?.toLowerCase()
          .includes(searchText) ||
        transaction.category
          ?.toLowerCase()
          .includes(searchText)
      );
    })
    .filter((transaction) => {
      if (typeFilter === "all") {
        return true;
      }

      return transaction.type === typeFilter;
    })
    .filter((transaction) => {
      if (categoryFilter === "all") {
        return true;
      }

      return (
        transaction.category === categoryFilter
      );
    })
    .sort((a, b) => {
      if (sortBy === "amount-high") {
        return (
          Number(b.amount) -
          Number(a.amount)
        );
      }

      if (sortBy === "amount-low") {
        return (
          Number(a.amount) -
          Number(b.amount)
        );
      }

      if (sortBy === "date-old") {
        return (
          new Date(a.date) -
          new Date(b.date)
        );
      }

      return (
        new Date(b.date) -
        new Date(a.date)
      );
    });

  // =========================
  // TOTALS
  // =========================

  const totalIncome = transactions
    .filter(
      (item) => item.type === "income"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );

  const totalExpense = transactions
    .filter(
      (item) => item.type === "expense"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );

  const balance =
    totalIncome - totalExpense;

  // =========================
  // CHART DATA
  // =========================

  const chartData = [
    {
      name: "Income",
      value: totalIncome,
    },
    {
      name: "Expense",
      value: totalExpense,
    },
  ];

  // =========================
  // LOGIN / REGISTER PAGE
  // =========================

  if (!token) {
    return (
      <div className="auth-page">

        <div className="auth-card">

          <div className="text-center mb-4">

            <div className="logo">
              💰
            </div>

            <h2>
              Expense Tracker
            </h2>

            <p className="text-muted">
              Manage your money smarter
            </p>

          </div>

          <div className="auth-tabs">

            <button
              type="button"
              className={
                isLogin ? "active" : ""
              }
              onClick={() => {
                setIsLogin(true);
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                !isLogin ? "active" : ""
              }
              onClick={() => {
                setIsLogin(false);
                setMessage("");
              }}
            >
              Register
            </button>

          </div>

          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth}>

            {!isLogin && (
              <div className="mb-3">

                <label className="form-label">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

              </div>
            )}

            <div className="mb-3">

              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />

            </div>

            <div className="mb-4">

              <label className="form-label">
                Password
              </label>

              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
              />

            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>

          </form>

          <p className="text-center mt-4 mb-0">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}{" "}

            <button
              type="button"
              className="switch-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
            >
              {isLogin
                ? "Register"
                : "Login"}
            </button>

          </p>

        </div>

      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="dashboard">

      {/* NAVBAR */}

      <nav className="navbar navbar-dark bg-dark px-4">

        <span className="navbar-brand fw-bold">
          💰 Expense Tracker
        </span>

        <div className="text-white">

          <span className="me-3">
            Hi, {user?.name || "User"}
          </span>

          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* MAIN */}

      <div className="container py-4">

        <h2 className="mb-4">
          Dashboard
        </h2>

        {message && (
          <div className="alert alert-info">
            {message}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="row g-3 mb-4">

          <div className="col-md-4">

            <div className="summary-card balance-card">

              <p>
                Total Balance
              </p>

              <h3>
                ${balance.toFixed(2)}
              </h3>

            </div>

          </div>

          <div className="col-md-4">

            <div className="summary-card income-card">

              <p>
                Total Income
              </p>

              <h3>
                ${totalIncome.toFixed(2)}
              </h3>

            </div>

          </div>

          <div className="col-md-4">

            <div className="summary-card expense-card">

              <p>
                Total Expense
              </p>

              <h3>
                ${totalExpense.toFixed(2)}
              </h3>

            </div>

          </div>

        </div>

        {/* CHART */}

        <div className="card shadow-sm mb-4">

          <div className="card-body">

            <h5 className="card-title mb-3">
              📊 Income vs Expense
            </h5>

            {totalIncome === 0 &&
            totalExpense === 0 ? (

              <div className="text-center text-muted py-5">

                <div style={{ fontSize: "40px" }}>
                  📊
                </div>

                <h6 className="mt-2">
                  No data available
                </h6>

                <p className="mb-0">
                  Add transactions to see
                  your chart.
                </p>

              </div>

            ) : (

              <div
                style={{
                  width: "100%",
                  height: 320,
                }}
              >

                <ResponsiveContainer>

                  <PieChart>

                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      label
                    >

                      {chartData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `$${Number(
                          value
                        ).toFixed(2)}`
                      }
                    />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>

        </div>

        <div className="row g-4">

          {/* ADD / EDIT FORM */}

          <div className="col-lg-4">

            <div className="card shadow-sm">

              <div className="card-body">

                <h5 className="card-title mb-3">

                  {editingId
                    ? "✏️ Edit Transaction"
                    : "➕ Add Transaction"}

                </h5>

                <form
                  onSubmit={saveTransaction}
                >

                  {/* TYPE */}

                  <div className="mb-3">

                    <label className="form-label">
                      Type
                    </label>

                    <select
                      name="type"
                      className="form-select"
                      value={
                        transactionForm.type
                      }
                      onChange={
                        handleTransactionChange
                      }
                    >

                      <option value="expense">
                        Expense
                      </option>

                      <option value="income">
                        Income
                      </option>

                    </select>

                  </div>

                  {/* AMOUNT */}

                  <div className="mb-3">

                    <label className="form-label">
                      Amount
                    </label>

                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      placeholder="Enter amount"
                      value={
                        transactionForm.amount
                      }
                      onChange={
                        handleTransactionChange
                      }
                      min="1"
                      required
                    />

                  </div>

                  {/* CATEGORY */}

                  <div className="mb-3">

                    <label className="form-label">
                      Category
                    </label>

                    <select
                      name="category"
                      className="form-select"
                      value={
                        transactionForm.category
                      }
                      onChange={
                        handleTransactionChange
                      }
                    >

                      <option value="Food">
                        Food
                      </option>

                      <option value="Shopping">
                        Shopping
                      </option>

                      <option value="Travel">
                        Travel
                      </option>

                      <option value="Bills">
                        Bills
                      </option>

                      <option value="Education">
                        Education
                      </option>

                      <option value="Health">
                        Health
                      </option>

                      <option value="Salary">
                        Salary
                      </option>

                      <option value="Business">
                        Business
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  {/* DESCRIPTION */}

                  <div className="mb-3">

                    <label className="form-label">
                      Description
                    </label>

                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      placeholder="Description"
                      value={
                        transactionForm.description
                      }
                      onChange={
                        handleTransactionChange
                      }
                    />

                  </div>

                  {/* DATE */}

                  <div className="mb-3">

                    <label className="form-label">
                      Date
                    </label>

                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={
                        transactionForm.date
                      }
                      onChange={
                        handleTransactionChange
                      }
                    />

                  </div>

                  {/* SAVE BUTTON */}

                  <button
                    type="submit"
                    className={
                      editingId
                        ? "btn btn-success w-100"
                        : "btn btn-primary w-100"
                    }
                  >

                    {editingId
                      ? "💾 Update Transaction"
                      : "➕ Add Transaction"}

                  </button>

                  {/* CANCEL EDIT */}

                  {editingId && (

                    <button
                      type="button"
                      className="btn btn-secondary w-100 mt-2"
                      onClick={cancelEdit}
                    >
                      ❌ Cancel Edit
                    </button>

                  )}

                </form>

              </div>

            </div>

          </div>

          {/* TRANSACTION HISTORY */}

          <div className="col-lg-8">

            <div className="card shadow-sm">

              <div className="card-body">

                <h5 className="card-title mb-3">
                  Transaction History
                </h5>

                {/* FILTERS */}

                <div className="row g-2 mb-3">

                  <div className="col-md-4">

                    <input
                      type="text"
                      className="form-control"
                      placeholder="🔎 Search..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="col-md-2">

                    <select
                      className="form-select"
                      value={typeFilter}
                      onChange={(e) =>
                        setTypeFilter(
                          e.target.value
                        )
                      }
                    >

                      <option value="all">
                        All Types
                      </option>

                      <option value="income">
                        Income
                      </option>

                      <option value="expense">
                        Expense
                      </option>

                    </select>

                  </div>

                  <div className="col-md-3">

                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) =>
                        setCategoryFilter(
                          e.target.value
                        )
                      }
                    >

                      <option value="all">
                        All Categories
                      </option>

                      <option value="Food">
                        Food
                      </option>

                      <option value="Shopping">
                        Shopping
                      </option>

                      <option value="Travel">
                        Travel
                      </option>

                      <option value="Bills">
                        Bills
                      </option>

                      <option value="Education">
                        Education
                      </option>

                      <option value="Health">
                        Health
                      </option>

                      <option value="Salary">
                        Salary
                      </option>

                      <option value="Business">
                        Business
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="col-md-3">

                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value
                        )
                      }
                    >

                      <option value="date">
                        Newest First
                      </option>

                      <option value="date-old">
                        Oldest First
                      </option>

                      <option value="amount-high">
                        Highest Amount
                      </option>

                      <option value="amount-low">
                        Lowest Amount
                      </option>

                    </select>

                  </div>

                </div>

                {/* TRANSACTION TABLE */}

                {filteredTransactions.length ===
                0 ? (

                  <div className="text-center text-muted py-5">

                    <h5>
                      No transactions found
                    </h5>

                    <p>
                      Add a transaction or
                      change your filters.
                    </p>

                  </div>

                ) : (

                  <div className="table-responsive">

                    <table className="table align-middle">

                      <thead>

                        <tr>

                          <th>
                            Type
                          </th>

                          <th>
                            Category
                          </th>

                          <th>
                            Description
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Amount
                          </th>

                          <th>
                            Action
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredTransactions.map(
                          (transaction) => (

                            <tr
                              key={
                                transaction._id
                              }
                            >

                              <td>

                                <span
                                  className={
                                    transaction.type ===
                                    "income"
                                      ? "badge bg-success"
                                      : "badge bg-danger"
                                  }
                                >

                                  {
                                    transaction.type
                                  }

                                </span>

                              </td>

                              <td>
                                {
                                  transaction.category
                                }
                              </td>

                              <td>
                                {
                                  transaction.description ||
                                  "-"
                                }
                              </td>

                              <td>
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}
                              </td>

                              <td
                                className={
                                  transaction.type ===
                                  "income"
                                    ? "text-success fw-bold"
                                    : "text-danger fw-bold"
                                }
                              >

                                {transaction.type ===
                                "income"
                                  ? "+"
                                  : "-"}

                                $
                                {Number(
                                  transaction.amount
                                ).toFixed(2)}

                              </td>

                              <td>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary me-2"
                                  onClick={() =>
                                    editTransaction(
                                      transaction
                                    )
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    deleteTransaction(
                                      transaction._id
                                    )
                                  }
                                >
                                  🗑️ Delete
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;