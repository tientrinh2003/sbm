'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatbotResponse } from '@/types/chatbot';
import { AlertTriangle, Send, Bot, User, TrendingUp, Heart, Activity, Globe } from 'lucide-react';

interface EnhancedChatInterfaceProps {
  title?: string;
  placeholder?: string;
  roleContext?: {
    showMeasurements?: boolean;
    showPatientInsights?: boolean;
    showDoctorSummary?: boolean;
  };
}

export default function EnhancedChatInterface({ 
  title = "SmartBP AI Assistant", 
  placeholder = "Hỏi về huyết áp, sức khỏe, hoặc hệ thống...",
  roleContext = {}
}: EnhancedChatInterfaceProps) {
  const { data: session } = useSession();
  const [language, setLanguage] = useState<'vi' | 'en' | 'auto'>('auto');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: language === 'en' 
        ? 'Hello! I am SmartBP\'s AI assistant. I can help you with blood pressure, health, and system guidance. How can I assist you?'
        : 'Xin chào! Tôi là trợ lý AI của SmartBP. Tôi có thể giúp bạn về các vấn đề liên quan đến huyết áp, sức khỏe, và hướng dẫn sử dụng hệ thống. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<ChatbotResponse | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([{
      id: '1',
      text: language === 'en' 
        ? 'Hello! I am SmartBP\'s AI assistant. I can help you with blood pressure, health, and system guidance. How can I assist you?'
        : 'Xin chào! Tôi là trợ lý AI của SmartBP. Tôi có thể giúp bạn về các vấn đề liên quan đến huyết áp, sức khỏe, và hướng dẫn sử dụng hệ thống. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date()
    }]);
    setConversationId(''); // Reset conversation when language changes
  }, [language]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || isLoading || !session) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ChatbotResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setLastResponse(data);
      setSuggestions(data.suggestions || []);
      setConversationId(data.conversation_id);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        context: {
          suggestions: data.suggestions,
          requires_attention: data.requires_medical_attention,
          referenced_data: data.data_insights?.mentioned_measurements ? ['measurements'] : []
        }
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Xin lỗi, có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng thử lại. (${error instanceof Error ? error.message : 'Unknown error'})`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getUserRoleBadge = () => {
    const userRole = (session as any)?.role;
    if (!userRole) return null;
    
    const roleColors = {
      PATIENT: 'bg-blue-100 text-blue-800',
      DOCTOR: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800'
    };

    const roleIcons = {
      PATIENT: <Heart className="w-3 h-3" />,
      DOCTOR: <Activity className="w-3 h-3" />,
      ADMIN: <TrendingUp className="w-3 h-3" />
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[userRole as keyof typeof roleColors]}`}>
        {roleIcons[userRole as keyof typeof roleIcons]}
        {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              {language === 'en' ? 'Smart AI Assistant' : 'Trợ lý AI thông minh'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
            <Globe className="w-3 h-3 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'vi' | 'en' | 'auto')}
              className="text-xs bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="auto">Auto</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          {getUserRoleBadge()}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-full ${message.isUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {message.isUser ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className={`flex-1 max-w-[80%] ${message.isUser ? 'text-right' : ''}`}>
              <div className={`p-3 rounded-lg ${
                message.isUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                {message.context?.requires_attention && (
                  <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Cần chú ý y tế
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Thinking...' : 'Đang suy nghĩ...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">
            {language === 'en' ? 'Suggested questions:' : 'Gợi ý câu hỏi:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              language === 'en' 
                ? "Ask about blood pressure, health, or system..." 
                : "Hỏi về huyết áp, sức khỏe, hoặc hệ thống..."
            }
            className="flex-1 resize-none border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading || !session}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading || !session}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {language === 'en' ? 'Send' : 'Gửi'}
          </Button>
        </div>
        {!session && (
          <p className="text-sm text-gray-500 mt-2">
            {language === 'en' 
              ? 'Please log in to use the AI assistant' 
              : 'Vui lòng đăng nhập để sử dụng trợ lý AI'
            }
          </p>
        )}
      </div>
    </div>
  );
}