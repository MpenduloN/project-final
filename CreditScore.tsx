import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Award, TrendingUp, TrendingDown } from 'lucide-react';

interface CreditScoreEntry {
  id: string;
  score: number;
  score_date: string;
  provider: string;
  created_at: string;
}

export function CreditScore() {
  const { user } = useAuth();
  const [scores, setScores] = useState<CreditScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    score: '',
    score_date: new Date().toISOString().split('T')[0],
    provider: 'Self-reported',
  });

  useEffect(() => {
    if (user) {
      loadScores();
    }
  }, [user]);

  const loadScores = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('score_date', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error loading credit scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from('credit_scores').insert({
        user_id: user.id,
        score: parseInt(formData.score),
        score_date: formData.score_date,
        provider: formData.provider,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        score: '',
        score_date: new Date().toISOString().split('T')[0],
        provider: 'Self-reported',
      });
      loadScores();
    } catch (error) {
      console.error('Error adding credit score:', error);
    }
  };

  const getScoreRating = (score: number) => {
    if (score >= 800) return { label: 'Exceptional', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 740) return { label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 670) return { label: 'Good', color: 'text-teal-600', bg: 'bg-teal-100' };
    if (score >= 580) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getScoreTrend = () => {
    if (scores.length < 2) return null;
    const latest = scores[0].score;
    const previous = scores[1].score;
    const diff = latest - previous;
    return { diff, isPositive: diff >= 0 };
  };

  const currentScore = scores.length > 0 ? scores[0].score : null;
  const rating = currentScore ? getScoreRating(currentScore) : null;
  const trend = getScoreTrend();

  if (loading) {
    return <div className="text-center py-12">Loading credit score data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Score</h1>
          <p className="text-gray-600">Monitor your credit health over time</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Score
        </button>
      </div>

      {currentScore ? (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600 mb-2">Current Credit Score</p>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-6xl font-bold text-gray-900">{currentScore}</h2>
                  {rating && (
                    <span className={`px-4 py-2 rounded-full font-bold ${rating.bg} ${rating.color}`}>
                      {rating.label}
                    </span>
                  )}
                </div>
                {trend && (
                  <div className={`flex items-center gap-2 mt-3 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {trend.isPositive ? '+' : ''}{trend.diff} points since last entry
                    </span>
                  </div>
                )}
              </div>
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Award className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="bg-red-500 flex-1" />
                <div className="bg-orange-500 flex-1" />
                <div className="bg-yellow-500 flex-1" />
                <div className="bg-teal-500 flex-1" />
                <div className="bg-green-500 flex-1" />
              </div>
              <div
                className="absolute top-0 h-full w-1 bg-gray-900"
                style={{ left: `${((currentScore - 300) / 550) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  You
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>300</span>
              <span>850</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">What Affects Your Score</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Payment History</span>
                  <span className="font-medium">35%</span>
                </li>
                <li className="flex justify-between">
                  <span>Credit Utilization</span>
                  <span className="font-medium">30%</span>
                </li>
                <li className="flex justify-between">
                  <span>Credit History Length</span>
                  <span className="font-medium">15%</span>
                </li>
                <li className="flex justify-between">
                  <span>New Credit</span>
                  <span className="font-medium">10%</span>
                </li>
                <li className="flex justify-between">
                  <span>Credit Mix</span>
                  <span className="font-medium">10%</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Improve Your Score</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Pay bills on time, every time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Keep credit utilization below 30%</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Don't close old credit accounts</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Limit new credit applications</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Dispute errors on credit report</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Score Ranges</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-gray-600">800-850: Exceptional</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-gray-600">740-799: Very Good</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full" />
                  <span className="text-gray-600">670-739: Good</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-gray-600">580-669: Fair</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-gray-600">300-579: Poor</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Score History</h2>
            <div className="space-y-3">
              {scores.map((entry) => {
                const entryRating = getScoreRating(entry.score);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${entryRating.bg}`}>
                        <Award className={`w-6 h-6 ${entryRating.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{entry.score}</p>
                        <p className="text-sm text-gray-500">{entry.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${entryRating.bg} ${entryRating.color}`}>
                        {entryRating.label}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(entry.score_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Credit Score Data</h3>
          <p className="text-gray-600 mb-6">
            Start tracking your credit score to monitor your financial health over time
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Your First Score
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Credit Score</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Score (300-850)
                </label>
                <input
                  type="number"
                  min="300"
                  max="850"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="720"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.score_date}
                  onChange={(e) => setFormData({ ...formData, score_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Self-reported">Self-reported</option>
                  <option value="Equifax">Equifax</option>
                  <option value="Experian">Experian</option>
                  <option value="TransUnion">TransUnion</option>
                  <option value="Credit Karma">Credit Karma</option>
                  <option value="Other">Other</option>
                </select>
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
                  Add Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
