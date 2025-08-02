import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import LoginForm from './LoginForm';
import ChatInterface from './ChatInterface';

const ChatApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const webSocket = useWebSocket();

  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleLogin = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
    webSocket.joinRoom(user);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!isLoggedIn) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <ChatInterface
      username={username}
      webSocket={webSocket}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
};

export default ChatApp;