import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, TrendingUp, TrendingDown, Trash2, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  account_id: string | null;
}

interface Account {
  id: string;
  account_name: string;
}

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const [formData, setFormData] = useState({
    transaction_type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    account_id: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [transactionsRes, accountsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false }),
        supabase.from('accounts').select('id, account_name').eq('user_id', user.id),
      ]);

      setTransactions(transactionsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_type: formData.transaction_type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        transaction_date: formData.transaction_date,
        account_id: formData.account_id || null,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        transaction_type: 'expense',
        category: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) => filterType === 'all' || t.transaction_type === filterType
  );

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'];
  const expenseCategories = [
    'Groceries',
    'Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Education',
    'Other',
  ];

  const categories = formData.transaction_type === 'income' ? incomeCategories : expenseCategories;

  if (loading) {
    return <div className="text-center py-12">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'income' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Expenses
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions found. Add your first transaction to get started!
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{transaction.category}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={`text-xl font-bold ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}R
                    {Number(transaction.amount).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_type: 'expense' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.transaction_type === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_type: 'income' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.transaction_type === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account (Optional)
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">No account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
