import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import styles from '../../styles/components/ui/ChatInterface.module.css';
import { sendAIChat, getChatbotHealth } from '@/services/chat_service';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [domain, setDomain] = useState<'stress' | 'burnout' | 'career' | 'relationships'>('stress');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize welcome message when user context is available
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{
        id: '1',
        text: `Hi ${user.firstName}! I'm Sehat-Saathi, your supportive companion. How are you feeling today? 💚`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } else if (!user && messages.length === 0) {
      setMessages([{
        id: '1',
        text: "Hi there! I'm Sehat-Saathi, your supportive companion. How are you feeling today? 💚",
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [user, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll chatbot health
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await getChatbotHealth();
      if (mounted) setIsOnline(ok);
    };
    check();
    const id = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    try {
      const data = await sendAIChat({ message: userMessage.text, domain, update_profile: undefined });
      const botText = data?.reply || "I'm here for you.";
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };
      const suggestions: string[] | undefined = data?.suggestions;

      setMessages(prev => {
        const next = [...prev, botMessage];
        if (suggestions && suggestions.length) {
          const sugText = `Suggestions:\n- ${suggestions.join('\n- ')}`;
          next.push({ id: (Date.now() + 2).toString(), text: sugText, sender: 'bot', timestamp: new Date() });
        }
        return next;
      });
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 3).toString(),
        text: 'Sorry, I could not connect right now. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatOverlay}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div className={styles.botInfo}>
            <Bot className={styles.botIcon} />
            <div>
              <h3>Sehat-Saathi</h3>
              <span className={styles.status} style={{ color: isOnline ? '#10B981' : '#EF4444' }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Domain Selector */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 16px 8px 16px' }}>
          <label htmlFor="domain-select" style={{ fontSize: 12, color: '#6b7280' }}>Topic:</label>
          <select
            id="domain-select"
            value={domain}
            onChange={(e) => setDomain(e.target.value as 'stress' | 'burnout' | 'career' | 'relationships')}
            style={{
              flex: '0 0 auto',
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: 'white',
              fontSize: 12,
              color: '#374151'
            }}
            aria-label="Select conversation topic"
          >
            <option value="stress">Stress</option>
            <option value="burnout">Burnout</option>
            <option value="career">Career</option>
            <option value="relationships">Relationships</option>
          </select>
        </div>

        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.sender]}`}
            >
              <div className={styles.messageIcon}>
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={styles.messageContent}>
                <p>{message.text}</p>
                <span className={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={styles.messageIcon}>
                <Bot size={16} />
              </div>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className={styles.messageInput}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className={styles.sendButton}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
