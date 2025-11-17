import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  created_at: string;
}

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('budget') || lowerMessage.includes('spend')) {
      return "Great question about budgeting! A popular method is the 50/30/20 rule: allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. Track your expenses regularly and adjust as needed. Would you like help setting up a budget plan?";
    }

    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "Excellent focus on savings! Start by building an emergency fund covering 3-6 months of expenses. Then consider high-yield savings accounts or automated transfers. Even small amounts add up over time. What's your current savings goal?";
    }

    if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
      return "Managing debt is crucial for financial health. Consider the avalanche method (paying off highest interest first) or snowball method (smallest balance first). Make minimum payments on all debts while focusing extra payments on one. Would you like help creating a debt payoff plan?";
    }

    if (lowerMessage.includes('invest') || lowerMessage.includes('stock')) {
      return "Investing is key to building wealth! Start with understanding your risk tolerance and time horizon. Consider diversified index funds for beginners. Remember: invest for the long term, don't try to time the market, and never invest money you can't afford to lose. Have you started investing yet?";
    }

    if (lowerMessage.includes('credit score')) {
      return "Your credit score impacts loan rates and approval. Key factors: payment history (35%), credit utilization (30%), length of credit history (15%), new credit (10%), and credit mix (10%). Pay bills on time, keep utilization below 30%, and avoid opening too many accounts at once.";
    }

    if (lowerMessage.includes('retire') || lowerMessage.includes('retirement')) {
      return "Retirement planning is essential! Start early to benefit from compound interest. Contribute to employer 401(k) matches first, then consider IRAs. Aim to save 15-20% of income. Use the rule of 72 to estimate investment doubling time. When do you plan to retire?";
    }

    if (lowerMessage.includes('emergency fund')) {
      return "An emergency fund is your financial safety net! Aim for 3-6 months of expenses in a high-yield savings account. Start small if needed - even $1000 can help. Keep it liquid and separate from daily spending accounts. This protects you from unexpected expenses without going into debt.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI Financial Advisor. I'm here to help you with budgeting, saving, investing, debt management, and achieving your financial goals. What would you like to discuss today?";
    }

    if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm here anytime you need financial guidance. Remember, small steps lead to big progress. Keep up the great work on your financial journey!";
    }

    return "That's an interesting question! For personalized financial advice, consider: What are your current financial goals? What's your income vs expenses? Do you have emergency savings? Understanding your full picture helps create the best strategy. What specific financial goal can I help you with?";
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const { error: userError } = await supabase.from('chat_conversations').insert({
        user_id: user.id,
        message: userMessage,
        sender: 'user',
      });

      if (userError) throw userError;

      const aiResponse = await generateAIResponse(userMessage);

      const { error: aiError } = await supabase.from('chat_conversations').insert({
        user_id: user.id,
        message: aiResponse,
        sender: 'ai',
      });

      if (aiError) throw aiError;

      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "How should I budget my money?",
    "How can I start saving more?",
    "What's the best way to pay off debt?",
    "How do I start investing?",
  ];

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Financial Advisor</h1>
        <p className="text-gray-600">Get personalized financial advice and guidance</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to AI Financial Advisor</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                I'm here to help you with budgeting, saving, investing, and achieving your financial goals.
                Ask me anything!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about budgeting, saving, investing..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
