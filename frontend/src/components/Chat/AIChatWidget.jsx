import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/authContextDef';
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  ChevronDown,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Package,
  Layers,
  History,
  Clock,
  Plus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Eye,
  Target
} from 'lucide-react';

const AI_API_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const ROLE_QUICK_PROMPTS = {
  ADMIN: [
    { label: 'Trạng thái hệ thống', query: 'Kiểm tra trạng thái hệ thống và kết nối CSDL PostgreSQL?', icon: Sparkles },
    { label: 'Thống kê người dùng', query: 'Thống kê số lượng người dùng theo từng vai trò?', icon: Users },
    { label: 'Tài khoản hoạt động', query: 'Báo cáo tổng số tài khoản đang hoạt động và bị khóa?', icon: Layers },
  ],
  SALESMAN: [
    { label: 'Khách hàng của tôi', query: 'Hôm nay tôi có bao nhiêu khách hàng tiềm năng mới?', icon: Users },
    { label: 'Sản phẩm được bán', query: 'Kiểm tra danh mục sản phẩm tôi được phân quyền bán?', icon: Package },
    { label: 'Cơ hội phụ trách', query: 'Tổng quan các cơ hội bán hàng tôi đang phụ trách?', icon: Layers },
    { label: 'Đơn hàng gần đây', query: 'Danh sách đơn hàng gần nhất của khách hàng do tôi phụ trách?', icon: TrendingUp },
  ],
  SALE_MANAGER: [
    { label: 'Leads mới hôm nay', query: 'Hôm nay hệ thống có bao nhiêu Lead mới và danh sách cụ thể?', icon: Users },
    { label: 'Báo cáo doanh số tháng', query: 'Báo cáo doanh thu thực tế và tiến độ chỉ tiêu tháng này?', icon: TrendingUp },
    { label: 'Kiểm tra tồn kho', query: 'Kiểm tra xem có sản phẩm nào đang sắp hết hàng không?', icon: Package },
    { label: 'Cơ hội bán hàng', query: 'Tổng quan các cơ hội bán hàng (Opportunities) đang mở?', icon: Layers },
  ]
};

const getWelcomeMessageForUser = (user) => {
  const role = user?.role || 'SALE_MANAGER';
  const name = user?.full_name || user?.username || '';
  if (role === 'ADMIN') {
    return `Xin chào ${name || 'Quản trị viên'}! Tôi là **Zen System Administrator AI** 🖥️\nTôi hỗ trợ bạn theo dõi **Sức khỏe hệ thống, Kết nối CSDL PostgreSQL & Thống kê tài khoản người dùng** theo vai trò.\n\nBạn cần kiểm tra thông số kỹ thuật nào hôm nay?`;
  }
  if (role === 'SALESMAN') {
    return `Xin chào ${name || 'bạn'}! Tôi là **Zen Sales Assistant** 💼\nTôi hỗ trợ bạn tra cứu **Khách hàng phụ trách, Cơ hội bán hàng, Sản phẩm được phân quyền & Tạo Lead mới** nhanh chóng.\n\nBạn cần tôi hỗ trợ việc gì hôm nay?`;
  }
  return `Xin chào ${name || 'Quản lý'}! Tôi là **Zen AI Assistant** 📊\nTôi được kết nối trực tiếp với cơ sở dữ liệu Zen CRM để hỗ trợ bạn tra cứu **Leads, Doanh số toàn công ty, Tồn kho & Chiến dịch** trong thời gian thực.\n\nBạn cần xem báo cáo nào hôm nay?`;
};

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
  const { user: authUser, role: authRole } = useAuth();
  const currentRole = (authRole || authUser?.role || 'SALE_MANAGER').toUpperCase();
  const currentUserId = authUser?.id || authUser?.username || 'user';
  const roleStorageKey = `${currentRole}_${currentUserId}`;
  const sessionKey = `zen_crm_ai_session_id_${roleStorageKey}`;
  const messagesKey = `zen_crm_ai_chat_messages_${roleStorageKey}`;

  const activePrompts = ROLE_QUICK_PROMPTS[currentRole] || ROLE_QUICK_PROMPTS.SALE_MANAGER;
  const roleBadge = currentRole === 'ADMIN' ? 'Admin' : currentRole === 'SALESMAN' ? 'Sales' : 'Manager';

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsList, setSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) return saved;
    const newId = `${currentRole.toLowerCase()}_sess_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(sessionKey, newId);
    return newId;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(messagesKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessageForUser(authUser),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Khi tài khoản hoặc vai trò thay đổi, chuyển đổi phiên và tin nhắn riêng của tài khoản/vai trò đó
  useEffect(() => {
    const savedSession = localStorage.getItem(sessionKey);
    const savedMsgs = localStorage.getItem(messagesKey);

    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newId = `${currentRole.toLowerCase()}_sess_${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(newId);
      localStorage.setItem(sessionKey, newId);
    }

    if (savedMsgs) {
      try {
        setMessages(JSON.parse(savedMsgs));
      } catch {
        // fallback
      }
    } else {
      const initialWelcome = [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: getWelcomeMessageForUser(authUser),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(initialWelcome);
      localStorage.setItem(messagesKey, JSON.stringify(initialWelcome));
    }
  }, [roleStorageKey]);

  // Tự động lưu lịch sử tin nhắn vào localStorage theo role/user khi có tin mới
  useEffect(() => {
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem(messagesKey, JSON.stringify(messages));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [messages, messagesKey]);

  useEffect(() => {
    // Health check AI service on mount
    fetch(`${AI_API_BASE}/api/health`, { method: 'GET', headers: getAuthHeaders() })
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isMaximized) {
          setIsMaximized(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMaximized]);

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
        headers: getAuthHeaders(),
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
      const newAiMsg = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Dạ tôi đã xử lý xong.',
        actions: data.actions || [],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newAiMsg]);

      // Đồng bộ thời gian thực cho giao diện bảng CRM (feat-028, feat-029 & feat-033)
      if (Array.isArray(data.actions) && data.actions.length > 0) {
        data.actions.forEach((act) => {
          if (act.type === 'lead_created' && act.lead) {
            window.dispatchEvent(new CustomEvent('crm:lead-created', { detail: act.lead }));
          } else if (act.type === 'opportunity_created' && act.opportunity) {
            window.dispatchEvent(new CustomEvent('crm:opportunity-created', { detail: act.opportunity }));
          }
        });
      } else if (typeof data.reply === 'string') {
        if (
          data.reply.includes('Đã thêm thành công khách hàng') ||
          data.reply.includes('đã được thêm thành công')
        ) {
          window.dispatchEvent(new CustomEvent('crm:refresh-leads'));
        }
        if (
          data.reply.includes('Đã tạo thành công cơ hội') ||
          data.reply.includes('tạo cơ hội bán hàng mới')
        ) {
          window.dispatchEvent(new CustomEvent('crm:refresh-opportunities'));
        }
      }
    } catch (err) {
      console.error('Lỗi kết nối AI Service:', err);
      setIsOnline(false);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Không thể kết nối với Zen AI Service:**\n\n${err.message}\n\n*Gợi ý:* Hãy chắc chắn bạn đã khởi động Python AI Service bằng lệnh:\n\`ai-agent-service/start.sh\` hoặc \`uvicorn main:app --port 8000\``,
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // ignore
    }
    const resetMsg = [
      {
        id: 'reset_' + Date.now(),
        role: 'assistant',
        content: `🔄 Phiên hội thoại đã được làm mới.\n\n${getWelcomeMessageForUser(authUser)}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(resetMsg);
    try {
      localStorage.setItem(messagesKey, JSON.stringify(resetMsg));
    } catch {
      // ignore
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${AI_API_BASE}/api/chat/sessions`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSessionsList(data.sessions || []);
      }
    } catch (e) {
      console.error('Không thể nạp danh sách phiên chat:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadSessions();
    }
  }, [showHistory]);

  const handleSelectSession = async (targetSessionId) => {
    if (targetSessionId === sessionId) {
      setShowHistory(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${AI_API_BASE}/api/chat/history?session_id=${targetSessionId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const serverMessages = (data.messages || []).map((m) => ({
          id: m.id || 'msg_' + Math.random(),
          role: m.role,
          content: m.content,
          time: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }));

        if (serverMessages.length > 0) {
          setMessages(serverMessages);
          localStorage.setItem(messagesKey, JSON.stringify(serverMessages));
        }
      }
    } catch (err) {
      console.error('Lỗi khi nạp tin nhắn phiên cũ:', err);
    } finally {
      setSessionId(targetSessionId);
      localStorage.setItem(sessionKey, targetSessionId);
      setLoading(false);
      setShowHistory(false);
    }
  };

  const handleStartNewChat = () => {
    const newId = `${currentRole.toLowerCase()}_sess_` + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    localStorage.setItem(sessionKey, newId);
    const welcomeMsg = [
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: getWelcomeMessageForUser(authUser),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(welcomeMsg);
    localStorage.setItem(messagesKey, JSON.stringify(welcomeMsg));
    setShowHistory(false);
  };

  const handleDeleteSession = async (targetId) => {
    try {
      await fetch(`${AI_API_BASE}/api/chat/session?session_id=${targetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setSessionsList((prev) => prev.filter((s) => s.session_id !== targetId));
      if (targetId === sessionId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error('Lỗi khi xóa phiên trò chuyện:', err);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`${
            isMaximized
              ? 'w-[95vw] sm:w-[780px] md:w-[920px] lg:w-[1100px] xl:w-[1250px] h-[88vh] max-h-[92vh] border-2 border-emerald-300'
              : 'w-[calc(100vw-24px)] sm:w-[440px] md:w-[460px] h-[580px] max-h-[85vh] border border-emerald-100'
          } bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
        >
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
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wider">
                    {roleBadge}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </div>
                <div className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span>{isOnline ? 'Gemini 3.5 Flash-Lite • DB Connected' : 'Chưa kết nối Backend AI'}</span>
                  {isMaximized && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-medium">
                      Toàn màn hình
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title={showHistory ? 'Quay lại cuộc trò chuyện' : 'Lịch sử các cuộc trò chuyện'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showHistory ? 'bg-white text-emerald-800 shadow-xs' : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={handleStartNewChat}
                title="Tạo cuộc trò chuyện mới"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện hiện tại"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Thu nhỏ về kích thước chuẩn' : 'Phóng to cửa sổ chat'}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMaximized(false);
                }}
                title="Thu nhỏ / Đóng"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showHistory ? (
            /* History Drawer / Panel */
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/70">
              <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Lịch sử hội thoại ({roleBadge})</span>
                </div>
                <button
                  onClick={handleStartNewChat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition cursor-pointer"
                  title="Bắt đầu phiên hội thoại mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hội thoại mới</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingSessions ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>Đang nạp danh sách lịch sử...</span>
                  </div>
                ) : sessionsList.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300 stroke-1" />
                    <p className="font-medium text-gray-600">Chưa có lịch sử hội thoại nào cho vai trò {roleBadge}</p>
                    <p className="text-[11px] text-gray-400 max-w-[260px] mx-auto">
                      Mọi câu hỏi và kết quả tra cứu CRM của bạn sẽ tự động được lưu và hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  sessionsList.map((sess) => {
                    const isCurrent = sess.session_id === sessionId;
                    return (
                      <div
                        key={sess.session_id}
                        onClick={() => handleSelectSession(sess.session_id)}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
                            : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isCurrent ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'
                                }`}
                              />
                              <h4 className="text-xs font-semibold text-gray-800 truncate">
                                {sess.title || 'Cuộc trò chuyện Zen AI'}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-medium shrink-0">
                                  Đang mở
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                              <span>{sess.message_count || 0} tin nhắn</span>
                              <span>•</span>
                              <span>
                                {sess.updated_at
                                  ? new Date(sess.updated_at).toLocaleString('vi-VN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })
                                  : 'Vừa xong'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(sess.session_id);
                            }}
                            title="Xóa cuộc trò chuyện này"
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Quick Prompts Carousel */}
              <div className="bg-emerald-50/70 border-b border-emerald-100/60 px-3 py-2 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
                {activePrompts.map((qp, idx) => {
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
                        Hãy chạy <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">ai-agent-service/start.sh</code> để kích hoạt trợ lý AI.
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
                      <div className={`${isMaximized ? 'max-w-[92%]' : 'max-w-[84%]'} flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${isMaximized ? 'text-xs sm:text-sm' : 'text-xs sm:text-[13px]'} leading-relaxed shadow-2xs ${
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
                        {isAssistant && Array.isArray(msg.actions) && msg.actions.map((act, actIdx) => {
                          if (act.type === 'lead_created' && act.lead) {
                            const l = act.lead;
                            return (
                              <div
                                key={actIdx}
                                className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 text-xs text-gray-800 space-y-2 shadow-2xs w-full text-left"
                              >
                                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60 font-semibold text-emerald-950">
                                  <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                    Khách hàng #{l.id}: {l.ho_va_ten}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-medium shadow-2xs">
                                    <CheckCircle2 className="w-3 h-3" /> Đã lưu CSDL
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-700">
                                  <div><span className="text-gray-500">SĐT:</span> <strong className="text-gray-900">{l.so_dien_thoai}</strong></div>
                                  <div className="truncate"><span className="text-gray-500">Email:</span> <strong className="text-gray-900">{l.email}</strong></div>
                                  {l.nghe_nghiep && l.nghe_nghiep !== 'Chưa cập nhật' && (
                                    <div><span className="text-gray-500">Nghề:</span> {l.nghe_nghiep}</div>
                                  )}
                                  {l.nguoi_phu_trach && (
                                    <div><span className="text-gray-500">Phụ trách:</span> {l.nguoi_phu_trach}</div>
                                  )}
                                  {l.dia_chi && l.dia_chi !== 'Chưa cập nhật' && (
                                    <div className="col-span-2 truncate"><span className="text-gray-500">Địa chỉ:</span> {l.dia_chi}</div>
                                  )}
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-emerald-200/60">
                                  <a
                                    href={`/leads/${l.id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3" /> Xem chi tiết
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleSendMessage(`Tạo cơ hội bán hàng mới cho khách hàng ${l.ho_va_ten}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-medium text-[11px] transition shadow-2xs cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-600" /> Tạo cơ hội (feat-029)
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (act.type === 'opportunity_created' && act.opportunity) {
                            const o = act.opportunity;
                            return (
                              <div
                                key={actIdx}
                                className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 text-xs text-gray-800 space-y-2 shadow-2xs w-full text-left"
                              >
                                <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60 font-semibold text-blue-950">
                                  <span className="flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    Cơ hội #{o.id}: {o.khach_hang}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-medium shadow-2xs">
                                    <CheckCircle2 className="w-3 h-3" /> Trạng thái: NEW
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-700">
                                  <div className="col-span-2 truncate"><span className="text-gray-500">Sản phẩm:</span> <strong className="text-gray-900">{o.san_pham}</strong></div>
                                  <div><span className="text-gray-500">Số lượng:</span> <strong className="text-gray-900">{o.so_luong_du_kien}</strong></div>
                                  <div><span className="text-gray-500">Đơn giá:</span> {o.don_gia_niem_yet}</div>
                                  <div><span className="text-gray-500">Dự kiến chốt:</span> {o.ngay_du_kien_chot}</div>
                                  <div className="col-span-2"><span className="text-gray-500">Doanh thu dự kiến:</span> <strong className="text-blue-700 font-bold ml-1">{o.doanh_thu_du_kien}</strong></div>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-blue-200/60">
                                  <a
                                    href={`/opportunities/${o.id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3" /> Xem chi tiết
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleSendMessage(`Ghi nhật ký chăm sóc cho cơ hội của ${o.khach_hang}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-800 font-medium text-[11px] transition shadow-2xs cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-blue-600" /> Ghi chăm sóc (feat-030)
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
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
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-[#2E8B57] to-[#3CB371] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/80"
        title="Mở Trợ lý AI Zen CRM"
      >
        <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-400"></span>
        </span>
        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        <span className="font-semibold text-xs sm:text-sm tracking-wide">Trợ lý AI</span>
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}

