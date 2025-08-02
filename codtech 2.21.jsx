import React from 'react';

interface MessageReactionsProps {
  reactions: { [emoji: string]: string[] };
  onReact?: (emoji: string) => void;
  theme: 'light' | 'dark';
  currentUserId?: string;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReact,
  theme,
  currentUserId
}) => {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        const hasReacted = currentUserId && userIds.includes(currentUserId);
        
        return (
          <button
            key={emoji}
            onClick={() => onReact?.(emoji)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
              hasReacted
                ? theme === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : theme === 'dark'
                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>{emoji}</span>
            <span>{userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;