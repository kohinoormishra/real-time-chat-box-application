import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Message, User } from '../hooks/useWebSocket';
import { Users, UserPlus, UserMinus, MoreVertical, Reply, Edit, Trash2, Pin, Heart, ThumbsUp, Laugh } from 'lucide-react';
import MessageReactions from './MessageReactions';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  theme: 'light' | 'dark';
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onReact?: (emoji: string) => void;
  currentUser?: User | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwnMessage, 
  theme, 
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  currentUser
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  if (message.type === 'user_joined' || message.type === 'user_left') {
    return (
      <div className="flex items-center justify-center my-2">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
        }`}>
          {message.type === 'user_joined' ? (
            <UserPlus className="w-3 h-3" />
          ) : (
            <UserMinus className="w-3 h-3" />
          )}
          <span>
            {message.username} {message.type === 'user_joined' ? 'joined' : 'left'} the room
          </span>
          <span className="opacity-75">• {formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div className={`px-4 py-2 rounded-2xl italic opacity-60 ${
            theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}>
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowQuickReactions(false);
      }}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1 px-1">
            <img
              src={message.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.username}`}
              alt={message.username}
              className="w-5 h-5 rounded-full"
            />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {message.username}
            </span>
          </div>
        )}
        
        <div className="relative">
          <div
            className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${
              isOwnMessage
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-100 rounded-bl-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
            }`}
          >
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded border-l-2 text-xs ${
                isOwnMessage
                  ? 'border-white/30 bg-white/10'
                  : theme === 'dark'
                  ? 'border-gray-500 bg-gray-600'
                  : 'border-gray-300 bg-gray-100'
              }`}>
                <div className="opacity-75">Replying to message</div>
              </div>
            )}
            
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
            
            {message.isEdited && (
              <span className={`text-xs opacity-60 ml-2 ${
                isOwnMessage ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                (edited)
              </span>
            )}
          </div>

          {/* Message Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              onReact={onReact}
              theme={theme}
              currentUserId={currentUser?.id}
            />
          )}

          {/* Quick Reactions */}
          {showQuickReactions && (
            <div className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} 
                           flex space-x-1 p-2 rounded-lg shadow-lg z-10 ${
              theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(emoji)}
                  className="hover:scale-125 transition-transform duration-150 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`text-xs mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        } ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} 
                       flex items-center space-x-1 p-1 rounded-lg shadow-lg z-20 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <button
            onClick={() => setShowQuickReactions(!showQuickReactions)}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Add reaction"
          >
            <Heart className="w-4 h-4" />
          </button>
          
          <button
            onClick={onReply}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>

          {isOwnMessage && (
            <>
              <button
                onClick={onEdit}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={onDelete}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                }`}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onPin}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-yellow-600'
            }`}
            title="Pin message"
          >
            <Pin className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;