import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Send, Image, User, ArrowLeft, Loader2, Sparkles, Building2 } from 'lucide-react';
import { io } from 'socket.io-client';

export const ChatWindow = () => {
  const { bookingId } = useParams(); // Selected booking chat room ID (optional)
  const { currUser } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Real-time states
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      if (res.data && res.data.success) {
        setConversations(res.data.conversations);
        
        // Auto select conversation if bookingId is in URL
        if (bookingId) {
          const found = res.data.conversations.find(c => c.bookingId === bookingId);
          if (found) {
            setSelectedConversation(found);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load chat conversations list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bId) => {
    setMessagesLoading(true);
    try {
      const res = await axios.get(`/api/chat/bookings/${bId}/messages`);
      if (res.data && res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load chat thread.');
    } finally {
      setMessagesLoading(false);
    }
  };

  // 1. Fetch conversations list on mount
  useEffect(() => {
    if (currUser) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [currUser, bookingId]);

  // 2. Fetch messages whenever selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.bookingId);
      
      // Initialize Socket connection
      if (!socketRef.current) {
        const socketUrl = import.meta.env.VITE_API_URL || (window.location.origin.includes('localhost') 
          ? 'http://localhost:8080' 
          : window.location.origin);

        socketRef.current = io(socketUrl);
      }

      // Join room
      socketRef.current.emit('joinRoom', { bookingId: selectedConversation.bookingId });

      // Socket Listeners
      socketRef.current.on('newMessage', (msg) => {
        if (msg.sender?._id !== currUser._id) {
          setMessages(prev => [...prev, msg]);
        }
      });

      socketRef.current.on('userTyping', ({ username, isTyping }) => {
        if (username !== currUser.username) {
          setOtherUserTyping(isTyping);
        }
      });

      // Polling fallback just in case socket disconnects
      const pollTimer = setInterval(() => {
        axios.get(`/api/chat/bookings/${selectedConversation.bookingId}/messages`)
          .then(res => {
            if (res.data && res.data.success) {
              setMessages(res.data.messages);
            }
          }).catch(err => console.error(err));
      }, 3500);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        clearInterval(pollTimer);
      };
    }
  }, [selectedConversation]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConversation) return;

    setSending(true);
    const msgText = text;
    setText('');
    
    // Stop typing emit
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        bookingId: selectedConversation.bookingId,
        username: currUser.username,
        isTyping: false
      });
    }

    try {
      const res = await axios.post(`/api/chat/bookings/${selectedConversation.bookingId}/messages`, {
        text: msgText
      });
      if (res.data && res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socketRef.current && selectedConversation) {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', {
          bookingId: selectedConversation.bookingId,
          username: currUser.username,
          isTyping: true
        });
      }

      // Debounce typing status resets
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('typing', {
          bookingId: selectedConversation.bookingId,
          username: currUser.username,
          isTyping: false
        });
      }, 2000);
    }
  };

  if (!currUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center animate-in fade-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose mx-auto">
          <Building2 className="h-8 w-8" />
        </div>
        <h4 className="mt-4 font-bold text-slate-800">Login Required</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Please log in to chat with stay hosts.
        </p>
        <Link to="/login" className="mt-5 inline-block rounded-full bg-brand-rose px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 text-decoration-none">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 h-[80vh] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar List of Conversations */}
      <div className="w-full md:w-80 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-4 overflow-y-auto">
        <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-3 mb-1">Conversations</h4>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
          </div>
        ) : conversations.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {conversations.map((c) => {
              const otherUser = currUser._id === c.guest?._id ? c.host : c.guest;
              const isSelected = selectedConversation?.bookingId === c.bookingId;
              
              return (
                <button
                  key={c.bookingId}
                  onClick={() => setSelectedConversation(c)}
                  className={`w-full rounded-xl p-3 text-left transition-all border cursor-pointer flex gap-3 items-center ${
                    isSelected 
                      ? 'border-brand-rose bg-rose-50/5 font-extrabold' 
                      : 'border-slate-50 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs uppercase text-slate-500 flex-shrink-0">
                    {otherUser?.username?.slice(0, 2) || 'US'}
                  </div>
                  <div className="flex-1 truncate flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">@{otherUser?.username || 'User'}</span>
                    <span className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                      {c.latestMessage?.text || 'No messages yet'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-wider">
            No booking chats recorded.
          </div>
        )}
      </div>

      {/* Selected Conversation chat pane */}
      <div className="flex-1 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
        {selectedConversation ? (
          <>
            {/* Chat Pane Header */}
            <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-extrabold text-xs text-slate-500">
                  {(currUser._id === selectedConversation.guest?._id ? selectedConversation.host?.username : selectedConversation.guest?.username)?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">
                    @{currUser._id === selectedConversation.guest?._id ? selectedConversation.host?.username : selectedConversation.guest?.username}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    Stay: {selectedConversation.listing?.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Thread list */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 bg-slate-50/20">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
                </div>
              ) : messages.map((m) => {
                const isOwn = m.sender?._id === currUser._id;
                return (
                  <div
                    key={m._id}
                    className={`flex flex-col max-w-[70%] rounded-2xl px-4.5 py-3 shadow-[0_2px_6px_rgba(0,0,0,0.01)] text-xs font-semibold leading-relaxed ${
                      isOwn 
                        ? 'bg-slate-900 text-white self-end rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 self-start rounded-tl-none'
                    }`}
                  >
                    <span>{m.text}</span>
                    <span className={`text-[8px] font-bold mt-1 text-right block ${isOwn ? 'text-slate-400' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="bg-white border border-slate-100 self-start rounded-2xl rounded-tl-none px-4 py-2 text-[10px] font-bold text-slate-400 animate-pulse">
                  Host is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Input Form */}
            <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Write stay coordinates, checkout times..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4.5 py-3 text-xs font-semibold text-slate-800 focus:border-brand-rose focus:outline-none transition-colors placeholder:text-slate-300"
                value={text}
                onChange={handleInputChange}
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="rounded-full bg-brand-rose p-3 text-white transition-colors hover:bg-brand-rose/90 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center">
              <Sparkles className="h-7 w-7" />
            </div>
            <h4 className="font-extrabold text-slate-800 m-0 leading-none">Select a Conversation</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Choose an active guest stay or host property booking from the sidebar list to start real-time messaging coordinates.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatWindow;
