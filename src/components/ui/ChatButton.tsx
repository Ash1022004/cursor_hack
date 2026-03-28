import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatInterface from './ChatInterface';
import styles from '../../styles/components/ui/ChatButton.module.css';

const ChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button 
        className={styles.floatingChat} 
        onClick={() => setIsChatOpen(true)}
      >
        <MessageCircle className={styles.icon} />
        <span>Talk to Sehat-Saathi</span>
      </button>
      
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
};

export default ChatButton;