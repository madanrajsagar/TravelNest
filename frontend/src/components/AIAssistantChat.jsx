import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Sparkles, AlertCircle, Maximize2, Minimize2, Moon, Sun } from 'lucide-react';
import { toast } from 'react-toastify';

export const AIAssistantChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm your personal TravelNest AI Consultant. Ask me anything about active stays, budgets, or destinations. Try one of the suggestions below!"
    }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Find stays under ₹5000",
    "Stays with swimming pools",
    "Recommend stays in Goa",
    "Suggest family-friendly stays"
  ];

  const handleSend = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setText('');
    setLoading(true);
    setStreamingText('');

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await axios.post('/api/ai/assistant/chat', {
        message: messageText,
        history: chatHistory
      });

      if (res.data && res.data.success) {
        const botReply = res.data.reply;
        
        // Simulating streaming typing effect
        let currentText = "";
        let index = 0;
        const interval = setInterval(() => {
          if (index < botReply.length) {
            currentText += botReply[index];
            setStreamingText(currentText);
            index += 3; // stream 3 characters at a time for fast & smooth render
          } else {
            clearInterval(interval);
            setMessages(prev => [...prev, { role: 'assistant', text: botReply }]);
            setStreamingText('');
            setLoading(false);
          }
        }, 15);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to TravelNest AI server.");
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, loading]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 duration-200 border-none cursor-pointer group"
      >
        <Sparkles className="h-6 w-6 text-brand-rose group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-rose opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-brand-rose text-[8px] font-bold text-white items-center justify-center">AI</span>
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
        isMinimized ? 'h-14' : 'h-[500px]'
      } ${
        isDarkMode 
          ? 'bg-slate-950 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-150 text-slate-800'
      }`}
    >
      
      {/* Header bar controls */}
      <div className={`p-4 flex items-center justify-between border-b ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-50 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-brand-rose" />
          <div>
            <span className="text-xs font-black tracking-tight block">TravelNest Companion</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">AI Personal Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button 
            type="button" 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-1 hover:text-slate-600 rounded cursor-pointer border-none bg-transparent"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-1 hover:text-slate-600 rounded cursor-pointer border-none bg-transparent"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>

          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="p-1 hover:text-slate-600 rounded cursor-pointer border-none bg-transparent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message space (hidden if minimized) */}
      {!isMinimized && (
        <>
          <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 ${
            isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50/10'
          }`}>
            {messages.map((m, idx) => {
              const isOwn = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-[0_1px_4px_rgba(0,0,0,0.01)] ${
                    isOwn 
                      ? 'bg-slate-900 text-white self-end rounded-tr-none' 
                      : isDarkMode
                        ? 'bg-slate-900 text-slate-100 border border-slate-800 self-start rounded-tl-none'
                        : 'bg-white text-slate-700 border border-slate-100 self-start rounded-tl-none'
                  }`}
                >
                  <p className="m-0 whitespace-pre-line leading-relaxed">{m.text}</p>
                </div>
              );
            })}

            {/* Simulated streaming bot response */}
            {streamingText && (
              <div className={`flex flex-col max-w-[80%] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs font-semibold leading-relaxed self-start ${
                isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-700 border border-slate-150'
              }`}>
                <p className="m-0 whitespace-pre-line leading-relaxed">{streamingText}</p>
              </div>
            )}

            {/* Loading placeholder */}
            {loading && !streamingText && (
              <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 self-start rounded-2xl rounded-tl-none px-4 py-2 text-[10px] font-bold text-slate-400 animate-pulse">
                Consultant is composing...
              </div>
            )}

            {/* Suggested prompts list (only shows when history is clean or at starts) */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Suggested Prompts</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left active:scale-95 ${
                        isDarkMode 
                          ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800' 
                          : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input field */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(text);
            }} 
            className={`p-3 border-t flex gap-2 items-center ${
              isDarkMode ? 'border-slate-850 bg-slate-900/40' : 'border-slate-100 bg-slate-50/20'
            }`}
          >
            <input
              type="text"
              placeholder="Ask about pools, budget stays, Latur..."
              className={`flex-1 rounded-full border px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-350 ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-900 text-white focus:border-brand-rose' 
                  : 'border-slate-200 bg-white text-slate-800 focus:border-brand-rose'
              }`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="rounded-full bg-brand-rose p-2.5 text-white transition-colors hover:bg-brand-rose/90 disabled:opacity-50 flex items-center justify-center cursor-pointer border-none"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </>
      )}

    </div>
  );
};

export default AIAssistantChat;
