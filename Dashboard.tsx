import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Wallet, Target, CreditCard, DollarSign } from 'lucide-react';

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalLoans: number;
  activeGoals: number;
  recentTransactions: Array<{
    id: string;
    category: string;
    amount: number;
    transaction_type: string;
    transaction_date: string;
    description: string | null;
  }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  incomeVsExpenses: Array<{ month: string; income: number; expenses: number }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalLoans: 0,
    activeGoals: 0,
    recentTransactions: [],
    expensesByCategory: [],
    incomeVsExpenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [
        accountsRes,
        transactionsRes,
        loansRes,
        goalsRes,
        profileRes,
      ] = await Promise.all([
        supabase.from('accounts').select('balance').eq('user_id', user.id),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(10),
        supabase.from('loans').select('current_balance').eq('user_id', user.id),
        supabase.from('goals').select('id').eq('user_id', user.id),
        supabase.from('user_profiles').select('monthly_income').eq('id', user.id).maybeSingle(),
      ]);

      const totalBalance = accountsRes.data?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
      const totalLoans = loansRes.data?.reduce((sum, loan) => sum + Number(loan.current_balance), 0) || 0;
      const activeGoals = goalsRes.data?.length || 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthTransactions = transactionsRes.data?.filter((t) => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      }) || [];

      const monthlyIncome = currentMonthTransactions
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = currentMonthTransactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expensesByCategory = currentMonthTransactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((acc, t) => {
          const existing = acc.find((c) => c.category === t.category);
          if (existing) {
            existing.total += Number(t.amount);
          } else {
            acc.push({ category: t.category, total: Number(t.amount) });
          }
          return acc;
        }, [] as Array<{ category: string; total: number }>)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - (5 - i), 1);
        return { month: d.toLocaleDateString('en-US', { month: 'short' }), monthNum: d.getMonth(), year: d.getFullYear() };
      });

      const incomeVsExpenses = last6Months.map((m) => {
        const monthTransactions = transactionsRes.data?.filter((t) => {
          const tDate = new Date(t.transaction_date);
          return tDate.getMonth() === m.monthNum && tDate.getFullYear() === m.year;
        }) || [];

        const income = monthTransactions
          .filter((t) => t.transaction_type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthTransactions
          .filter((t) => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return { month: m.month, income, expenses };
      });

      setData({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        totalLoans,
        activeGoals,
        recentTransactions: transactionsRes.data || [],
        expensesByCategory,
        incomeVsExpenses,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  const netWorth = data.totalBalance - data.totalLoans;
  const savingsRate = data.monthlyIncome > 0
    ? ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Overview</h1>
        <p className="text-gray-600">Track your wealth and achieve your financial goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Worth"
          value={`R${netWorth.toLocaleString()}`}
          icon={Wallet}
          color="blue"
          trend={netWorth >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Monthly Income"
          value={`R${data.monthlyIncome.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Monthly Expenses"
          value={`R${data.monthlyExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={Target}
          color="blue"
          trend={savingsRate > 20 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Income vs Expenses (6 Months)</h2>
          <div className="space-y-4">
            {data.incomeVsExpenses.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.month}</span>
                  <span className="text-gray-900 font-medium">
                    R{(item.income - item.expenses).toLocaleString()}
                  </span>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500 opacity-70"
                    style={{ width: `${Math.min((item.income / Math.max(...data.incomeVsExpenses.map(i => i.income))) * 100, 100)}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-red-500 opacity-50"
                    style={{ width: `${Math.min((item.expenses / Math.max(...data.incomeVsExpenses.map(i => i.income))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-600">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-gray-600">Expenses</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Spending Categories</h2>
          <div className="space-y-4">
            {data.expensesByCategory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expense data yet</p>
            ) : (
              data.expensesByCategory.map((cat, index) => {
                const maxTotal = Math.max(...data.expensesByCategory.map(c => c.total));
                const percentage = (cat.total / maxTotal) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{cat.category}</span>
                      <span className="text-gray-900 font-medium">R{cat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {data.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            data.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.transaction_type === 'income'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.category}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.transaction_type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}R
                    {Number(transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
