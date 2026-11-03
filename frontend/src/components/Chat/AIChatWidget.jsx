import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Package,
  Layers
} from 'lucide-react';

const AI_API_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

const QUICK_PROMPTS = [
  { label: 'Leads mới hôm nay', query: 'Hôm nay hệ thống có bao nhiêu Lead mới và danh sách cụ thể?', icon: Users },
  { label: 'Báo cáo doanh số tháng', query: 'Báo cáo doanh thu thực tế và tiến độ chỉ tiêu tháng này?', icon: TrendingUp },
  { label: 'Kiểm tra tồn kho', query: 'Kiểm tra xem có sản phẩm nào đang sắp hết hàng không?', icon: Package },
  { label: 'Cơ hội bán hàng', query: 'Tổng quan các cơ hội bán hàng (Opportunities) đang mở?', icon: Layers },
];

function formatMarkdown(content) {
  if (!content) return '';
  
  // Format tables
  const lines = content.split('\n');
  let inTable = false;
  let tableHtml = [];
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml.push('<div class="overflow-x-auto my-2"><table class="min-w-full text-xs border border-gray-200 rounded-lg">');
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (line.includes('---')) {
        // separator line, skip
        continue;
      }
      const isHeader = tableHtml.length === 1;
      tableHtml.push('<tr>');
      cells.forEach(cell => {
        tableHtml.push(
          isHeader 
            ? `<th class="px-2 py-1 bg-emerald-50 text-emerald-900 border font-semibold text-left">${cell}</th>`
            : `<td class="px-2 py-1 border text-gray-700">${cell}</td>`
        );
      });
      tableHtml.push('</tr>');
    } else {
      if (inTable) {
        tableHtml.push('</table></div>');
        processedLines.push(tableHtml.join(''));
        tableHtml = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }
  if (inTable) {
    tableHtml.push('</table></div>');
    processedLines.push(tableHtml.join(''));
  }

  let html = processedLines.join('\n');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-gray-900 text-sm mt-3 mb-1">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-gray-900 text-base mt-3 mb-1.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="font-extrabold text-gray-900 text-lg mt-3 mb-2">$1</h2>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // Code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-emerald-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

  // Bullet items
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700 my-0.5">$1</li>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-2 border-gray-200" />');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  // Clean double br inside lists & tables
  html = html.replace(/<\/li><br \/>/g, '</li>');
  html = html.replace(/<\/table><\/div><br \/>/g, '</table></div>');
  html = html.replace(/<br \/><div class="overflow-x-auto/g, '<div class="overflow-x-auto');

  return html;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Zen AI Assistant** 🤖\nTôi được kết nối trực tiếp với cơ sở dữ liệu Zen CRM để hỗ trợ bạn tra cứu **Leads, Doanh số, Tồn kho & Cơ hội bán hàng** trong thời gian thực.\n\nBạn cần tôi hỗ trợ việc gì hôm nay?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Health check AI service on mount
    fetch(`${AI_API_BASE}/api/health`, { method: 'GET' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setIsOnline(!!data?.database_connected);
      })
      .catch(() => {
        setIsOnline(false);
      });
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${AI_API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Mã lỗi máy chủ: ${res.status}`);
      }

      const data = await res.json();
      setIsOnline(true);
      setMessages(prev => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: data.reply || 'Dạ tôi đã xử lý xong.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Lỗi kết nối AI Service:', err);
      setIsOnline(false);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Không thể kết nối với Zen AI Service:**\n\n${err.message}\n\n*Gợi ý:* Hãy chắc chắn bạn đã khởi động Python AI Service bằng lệnh:\n\`ai_service/start.sh\` hoặc \`uvicorn main:app --port 8000\``,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${AI_API_BASE}/api/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // ignore
    }
    setMessages([
      {
        id: 'reset_' + Date.now(),
        role: 'assistant',
        content: '🔄 Phiên hội thoại đã được làm mới. Bạn có thể hỏi tôi câu hỏi mới bất kỳ lúc nào!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden mb-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2E8B57] to-[#3CB371] px-4 py-3.5 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold border border-white/30 shadow-xs">
                <Bot className="w-5 h-5 text-white" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  title={isOnline ? 'AI Service Trực tuyến' : 'AI Service Ngoại tuyến'}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm leading-tight tracking-wide">
                  <span>Zen AI Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </div>
                <div className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span>{isOnline ? 'Gemini 3.5 Flash-Lite • DB Connected' : 'Chưa kết nối Backend AI'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="bg-emerald-50/70 border-b border-emerald-100/60 px-3 py-2 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((qp, idx) => {
              const IconComp = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.query)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                >
                  <IconComp className="w-3 h-3 text-[#2E8B57]" />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
            {!isOnline && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">AI Service chưa chạy trên cổng 8000</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    Hãy chạy <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">ai_service/start.sh</code> để kích hoạt trợ lý AI.
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[84%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                        isAssistant
                          ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-xs'
                          : 'bg-[#2E8B57] text-white rounded-tr-xs font-medium'
                      }`}
                    >
                      {isAssistant ? (
                        <div
                          className="prose-xs space-y-1.5"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>Zen AI đang phân tích dữ liệu CRM...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về Lead, Doanh số, Sản phẩm, Tồn kho..."
                disabled={loading}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/40 focus:border-[#3CB371] transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-2xl bg-[#2E8B57] text-white hover:bg-[#257347] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                title="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-gray-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <span>Được hỗ trợ bởi Google Gemini & PostgreSQL</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#2E8B57] to-[#3CB371] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/80"
        title="Mở Trợ lý AI Zen CRM"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
        </span>
        <Bot className="w-5 h-5 text-white" />
        <span className="font-semibold text-sm tracking-wide">Trợ lý AI</span>
        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
