import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CreditCard, Wallet, TrendingUp, Building2, Trash2, Edit } from 'lucide-react';

interface Account {
  id: string;
  account_name: string;
  account_type: 'checking' | 'savings' | 'credit_card' | 'investment';
  institution: string | null;
  balance: number;
  is_manual: boolean;
  created_at: string;
}

export function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    account_name: '',
    account_type: 'checking' as 'checking' | 'savings' | 'credit_card' | 'investment',
    institution: '',
    balance: '',
  });

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        account_name: formData.account_name,
        account_type: formData.account_type,
        institution: formData.institution || null,
        balance: parseFloat(formData.balance),
        is_manual: true,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        account_name: '',
        account_type: 'checking',
        institution: '',
        balance: '',
      });
      loadAccounts();
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account? Associated transactions will not be deleted.')) return;

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return Wallet;
      case 'savings':
        return Building2;
      case 'credit_card':
        return CreditCard;
      case 'investment':
        return TrendingUp;
      default:
        return Wallet;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking':
        return 'bg-blue-100 text-blue-600';
      case 'savings':
        return 'bg-green-100 text-green-600';
      case 'credit_card':
        return 'bg-orange-100 text-orange-600';
      case 'investment':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  if (loading) {
    return <div className="text-center py-12">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts</h1>
          <p className="text-gray-600">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Balance</h2>
        <p className="text-4xl font-bold text-gray-900">R{totalBalance.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No accounts yet. Add your first account to get started!
          </div>
        ) : (
          accounts.map((account) => {
            const Icon = getAccountIcon(account.account_type);
            const colorClass = getAccountColor(account.account_type);

            return (
              <div
                key={account.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{account.account_name}</h3>
                <p className="text-sm text-gray-500 mb-4 capitalize">
                  {account.account_type.replace('_', ' ')}
                  {account.institution && ` • ${account.institution}`}
                </p>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R{Number(account.balance).toLocaleString()}
                  </p>
                </div>

                {account.is_manual && (
                  <div className="mt-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Manual Entry
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Bank Account Linking</h3>
            <p className="text-gray-600 text-sm mb-4">
              Automatically sync your transactions by connecting your bank accounts. This feature requires
              integration with a banking API service.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="My Checking Account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_type: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution (Optional)
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Bank of America"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
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
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
