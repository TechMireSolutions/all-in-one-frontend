import React, { useEffect, useState } from "react";
import { useAccountStore } from "../Store/accountStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Trash2, Edit2, X, Wallet, TrendingUp, TrendingDown,
  Calendar, FileText, Check, AlertCircle, Loader2, DollarSign, Filter
} from "lucide-react";

const Accounts = () => {
  const {
    transactions, stats, loading, error, fetchTransactions, fetchStats,
    createTransaction, updateTransaction, deleteTransaction
  } = useAccountStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "Income",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    fetchTransactions({ type, search: searchQuery });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchTransactions({ type: filterType, search: query });
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      title: "",
      type: "Income",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    setFormData({
      title: tx.title,
      type: tx.type,
      amount: tx.amount.toString(),
      date: tx.date,
      description: tx.description || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.amount) {
      errors.amount = "Amount is required";
    } else {
      const amt = parseFloat(formData.amount);
      if (isNaN(amt) || amt <= 0) {
        errors.amount = "Amount must be a positive number greater than zero";
      }
    }
    if (!formData.date) errors.date = "Date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    let result;
    if (editingTransaction) {
      result = await updateTransaction(editingTransaction.id, payload);
    } else {
      result = await createTransaction(payload);
    }

    if (result.success) {
      showToast(
        editingTransaction
          ? "Transaction updated successfully!"
          : "Transaction added successfully!"
      );
      setIsModalOpen(false);
    } else {
      showToast(result.error || "Something went wrong", "error");
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const result = await deleteTransaction(id);
      if (result.success) {
        showToast("Transaction deleted successfully!");
      } else {
        showToast(result.error || "Failed to delete transaction", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check size={18} className="text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="text-red-500" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Wallet className="text-orange-500" size={28} /> Finance & Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and record corporate income, operating expenses, and cash reserves.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 text-sm sm:text-base self-start md:self-auto transition-colors"
        >
          <Plus size={18} /> Add Transaction
        </motion.button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
              Rs. {stats.totalIncome.toLocaleString()}
            </h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-3">
            <TrendingUp size={100} className="text-emerald-500" />
          </div>
        </motion.div>

        {/* Expense Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
              Rs. {stats.totalExpense.toLocaleString()}
            </h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-3">
            <TrendingDown size={100} className="text-rose-500" />
          </div>
        </motion.div>

        {/* Remaining Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4 transition-colors ${
            stats.remaining < 0
              ? "border-red-200 bg-red-50/30"
              : "border-gray-100"
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              stats.remaining < 0
                ? "bg-red-100 text-red-600"
                : "bg-orange-50/80 text-orange-600"
            }`}
          >
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remaining Balance</p>
            <h3
              className={`text-2xl font-bold mt-0.5 ${
                stats.remaining < 0 ? "text-red-600 animate-pulse" : "text-gray-900"
              }`}
            >
              Rs. {stats.remaining.toLocaleString()}
            </h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-3">
            <Wallet size={100} className="text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search transactions by title..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white transition-shadow"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-1.5 p-1 bg-gray-200/60 rounded-xl self-stretch sm:self-auto">
            {["All", "Income", "Expense"].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === type
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Error / Loading / Content state */}
        {loading && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-sm font-semibold text-gray-400">Loading accounts ledger...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Transactions Found</h3>
            <p className="text-gray-400 text-sm max-w-sm mt-1 leading-relaxed">
              {searchQuery
                ? "No records matched your search query. Try adjusting your filters."
                : "The finance registry is currently empty. Record your first income or expense transaction now."}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Create Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Title / Description</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {tx.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-gray-900">{tx.title}</div>
                        {tx.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs sm:max-w-md">
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          tx.type === "Income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.type === "Income" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-extrabold whitespace-nowrap text-base ${
                        tx.type === "Income" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "Income" ? "+" : "-"} Rs. {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(tx)}
                          title="Edit"
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.title)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Slider Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wallet size={18} className="text-orange-500" />
                  {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Transaction Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, type: "Income" }))}
                      className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                        formData.type === "Income"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 text-gray-500"
                      }`}
                    >
                      <TrendingUp size={16} /> Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, type: "Expense" }))}
                      className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                        formData.type === "Expense"
                          ? "border-rose-500 bg-rose-50 text-rose-800 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 text-gray-500"
                      }`}
                    >
                      <TrendingDown size={16} /> Expense
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consultancy Services, Monthly Utility Bills"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition-shadow"
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 25000"
                      value={formData.amount}
                      onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition-shadow"
                    />
                    {formErrors.amount && (
                      <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.amount}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition-shadow"
                    />
                    {formErrors.date && (
                      <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.date}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter secondary comments or transaction references..."
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition-shadow resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 p-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-orange-500/10 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    ) : (
                      <>Save Transaction</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accounts;
