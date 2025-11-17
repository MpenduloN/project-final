import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Target, Trash2, TrendingUp, PiggyBank, DollarSign } from 'lucide-react';

interface Goal {
  id: string;
  goal_name: string;
  goal_type: 'savings' | 'debt' | 'investment';
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ goal: Goal; amount: string } | null>(null);

  const [formData, setFormData] = useState({
    goal_name: '',
    goal_type: 'savings' as 'savings' | 'debt' | 'investment',
    target_amount: '',
    current_amount: '',
    target_date: '',
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        goal_name: formData.goal_name,
        goal_type: formData.goal_type,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        target_date: formData.target_date || null,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        goal_name: '',
        goal_type: 'savings',
        target_amount: '',
        current_amount: '',
        target_date: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModal) return;

    try {
      const newAmount = parseFloat(updateModal.amount);
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', updateModal.goal.id);

      if (error) throw error;

      setUpdateModal(null);
      loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return PiggyBank;
      case 'debt':
        return DollarSign;
      case 'investment':
        return TrendingUp;
      default:
        return Target;
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'savings':
        return { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-500 to-green-600' };
      case 'debt':
        return { bg: 'bg-red-100', text: 'text-red-600', gradient: 'from-red-500 to-red-600' };
      case 'investment':
        return { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Goals</h1>
          <p className="text-gray-600">Set and achieve your financial milestones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            No goals yet. Create your first financial goal to start tracking your progress!
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
            const Icon = getGoalIcon(goal.goal_type);
            const colors = getGoalColor(goal.goal_type);
            const remaining = Number(goal.target_amount) - Number(goal.current_amount);

            return (
              <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{goal.goal_name}</h3>
                <p className="text-sm text-gray-500 mb-4 capitalize">{goal.goal_type} Goal</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current</span>
                    <span className="font-bold text-gray-900">
                      R{Number(goal.current_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target</span>
                    <span className="font-bold text-gray-900">
                      R{Number(goal.target_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className={`font-bold ${colors.text}`}>
                      R{remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                {goal.target_date && (
                  <div className="text-sm text-gray-500 mb-4">
                    Target: {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                )}

                <button
                  onClick={() => setUpdateModal({ goal, amount: goal.current_amount.toString() })}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Update Progress
                </button>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Financial Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={formData.goal_name}
                  onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="savings">Savings</option>
                  <option value="debt">Debt Reduction</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Progress</h2>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {updateModal.goal.goal_name}
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Target: R{Number(updateModal.goal.target_amount).toLocaleString()}
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={updateModal.amount}
                  onChange={(e) => setUpdateModal({ ...updateModal, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Current amount"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setUpdateModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
