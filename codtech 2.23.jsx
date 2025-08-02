import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Hash, Settings, Sun, Moon, Search, Paperclip, Smile, Pin, MoreVertical, Edit, Trash2, Reply, Wifi, WifiOff } from 'lucide-react';
import { UseWebSocketReturn } from '../hooks/useWebSocket';
import MessageBubble from './MessageBubble';
import UserList from './UserList';
import RoomList from './RoomList';
import TypingIndicator from './TypingIndicator';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MessageReactions from './MessageReactions';
import PinnedMessages from './PinnedMessages';
import ConnectionStatus from './ConnectionStatus';

interface ChatInterfaceProps {
  username: string;
  webSocket: UseWebSocketReturn;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  username,
  webSocket,
  theme,
  toggleTheme
}) => {
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    connectionStatus,
    messages,
    users,
    rooms,
    typingUsers,
    pinnedMessages,
    currentUser,
    sendMessage,
    switchRoom,
    createRoom,
    setTyping,
    reactToMessage,
    pinMessage,
    deleteMessage,
    editMessage,
    currentRoom,
    reconnect
  } = webSocket;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      if (editingMessage) {
        editMessage(editingMessage, message.trim(), currentRoom);
        setEditingMessage(null);
        setEditContent('');
      } else {
        sendMessage(message.trim(), currentRoom, replyingTo || undefined);
        setReplyingTo(null);
      }
      setMessage('');
      setTyping(false, currentRoom);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (value.trim()) {
      setTyping(true, currentRoom);
    } else {
      setTyping(false, currentRoom);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim(), newRoomDescription.trim(), isPrivateRoom);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivateRoom(false);
      setShowCreateRoom(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    inputRef.current?.focus();
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessage(messageId);
    setMessage(content);
    setEditContent(content);
    inputRef.current?.focus();
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId, currentRoom);
    }
  };

  const handlePin = (messageId: string) => {
    pinMessage(messageId, currentRoom);
  };

  const filteredMessages = messages.filter(msg =>
    msg.roomId === currentRoom &&
    (searchTerm === '' || 
     msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
     msg.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentRoomTypingUsers = typingUsers.filter(user => user.roomId === currentRoom);
  const replyingToMessage = replyingTo ? messages.find(msg => msg.id === replyingTo) : null;

  return (
    <div className={`flex h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r flex flex-col`}>
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ChatFlow Pro
              </h1>
            )}
            <div className="flex items-center space-x-2">
              <ConnectionStatus 
                status={connectionStatus} 
                onReconnect={reconnect}
                theme={theme}
              />
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <>
            <RoomList
              rooms={rooms}
              currentRoom={currentRoom}
              onRoomSelect={switchRoom}
              onCreateRoom={() => setShowCreateRoom(true)}
              theme={theme}
            />
            <UserList users={users} theme={theme} currentUser={currentUser} />
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hash className={`w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <h2 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {rooms.find(r => r.id === currentRoom)?.name || currentRoom}
              </h2>
              <div className={`flex items-center space-x-1 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {pinnedMessages.length > 0 && (
                <button
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                  <span className="ml-1 text-xs">{pinnedMessages.length}</span>
                </button>
              )}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-lg text-sm border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Messages */}
        {showPinnedMessages && (
          <PinnedMessages
            messages={pinnedMessages}
            theme={theme}
            onClose={() => setShowPinnedMessages(false)}
          />
        )}

        {/* Reply Banner */}
        {replyingToMessage && (
          <div className={`px-4 py-2 border-b ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply className="w-4 h-4 text-blue-500" />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Replying to <strong>{replyingToMessage.username}</strong>: {replyingToMessage.content.slice(0, 50)}...
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {filteredMessages.length === 0 ? (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages in #{currentRoom} yet.</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.username === username}
                theme={theme}
                onReply={() => handleReply(msg.id)}
                onEdit={() => handleEdit(msg.id, msg.content)}
                onDelete={() => handleDelete(msg.id)}
                onPin={() => handlePin(msg.id)}
                onReact={(emoji) => reactToMessage(msg.id, emoji, currentRoom)}
                currentUser={currentUser}
              />
            ))
          )}
          <TypingIndicator users={currentRoomTypingUsers} theme={theme} />
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <FileUpload
              onFileSelect={(file) => console.log('File selected:', file)}
              theme={theme}
            />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder={editingMessage ? 'Edit message...' : `Message #${currentRoom}`}
                className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                disabled={!isConnected}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-600'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            {editingMessage && (
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setMessage('');
                  setEditContent('');
                }}
                className={`px-3 py-2 rounded-lg text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl
                       hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                       transform hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Create New Room
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                autoFocus
              />
              <textarea
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                placeholder="Room description (optional)"
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border resize-none ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="rounded"
                />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Private room
                </span>
              </label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg
                           hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;