import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, DollarSign, Calendar, TrendingDown, Trash2 } from 'lucide-react';

interface Loan {
  id: string;
  loan_name: string;
  loan_type: 'mortgage' | 'auto' | 'student' | 'personal' | 'other';
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
}

export function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    loan_name: '',
    loan_type: 'personal' as 'mortgage' | 'auto' | 'student' | 'personal' | 'other',
    principal_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (user) {
      loadLoans();
    }
  }, [user]);

  const loadLoans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('loans').insert({
        user_id: user.id,
        loan_name: formData.loan_name,
        loan_type: formData.loan_type,
        principal_amount: parseFloat(formData.principal_amount),
        current_balance: parseFloat(formData.current_balance),
        interest_rate: parseFloat(formData.interest_rate),
        monthly_payment: parseFloat(formData.monthly_payment),
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        loan_name: '',
        loan_type: 'personal',
        principal_amount: '',
        current_balance: '',
        interest_rate: '',
        monthly_payment: '',
        start_date: '',
        end_date: '',
      });
      loadLoans();
    } catch (error) {
      console.error('Error adding loan:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loan?')) return;

    try {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
      loadLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const calculateProgress = (current: number, principal: number) => {
    const paid = principal - current;
    return (paid / principal) * 100;
  };

  const calculateMonthsRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const totalDebt = loans.reduce((sum, loan) => sum + Number(loan.current_balance), 0);
  const totalMonthlyPayments = loans.reduce((sum, loan) => sum + Number(loan.monthly_payment), 0);

  if (loading) {
    return <div className="text-center py-12">Loading loans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loans</h1>
          <p className="text-gray-600">Manage and track your debt</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Debt</p>
              <p className="text-3xl font-bold text-gray-900">R{totalDebt.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Payments</p>
              <p className="text-3xl font-bold text-gray-900">R{totalMonthlyPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            No loans tracked. Add your first loan to monitor your debt repayment!
          </div>
        ) : (
          loans.map((loan) => {
            const progress = calculateProgress(Number(loan.current_balance), Number(loan.principal_amount));
            const monthsRemaining = calculateMonthsRemaining(loan.end_date);

            return (
              <div key={loan.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{loan.loan_name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{loan.loan_type} Loan</p>
                  </div>
                  <button
                    onClick={() => handleDelete(loan.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                    <p className="text-lg font-bold text-red-600">
                      R{Number(loan.current_balance).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Original Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      R{Number(loan.principal_amount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
                    <p className="text-lg font-bold text-gray-900">{loan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
                    <p className="text-lg font-bold text-gray-900">
                      R{Number(loan.monthly_payment).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Repayment Progress</span>
                    <span className="font-medium text-gray-900">{progress.toFixed(1)}% paid</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {monthsRemaining} months remaining
                    </span>
                  </div>
                  <span className="text-gray-500">
                    Due: {new Date(loan.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Loan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Name</label>
                <input
                  type="text"
                  value={formData.loan_name}
                  onChange={(e) => setFormData({ ...formData, loan_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Car Loan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select
                  value={formData.loan_type}
                  onChange={(e) => setFormData({ ...formData, loan_type: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="auto">Auto</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.principal_amount}
                    onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="8000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="5.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Payment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_payment}
                    onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
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
                  Add Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
