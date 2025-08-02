import React, { useState } from 'react';
import { User } from '../hooks/useWebSocket';
import { Users, Circle, MessageCircle, MoreVertical, Crown } from 'lucide-react';

interface UserListProps {
  users: User[];
  theme: 'light' | 'dark';
  currentUser?: User | null;
}

const UserList: React.FC<UserListProps> = ({ users, theme, currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 fill-green-500';
      case 'away': return 'text-yellow-500 fill-yellow-500';
      case 'busy': return 'text-red-500 fill-red-500';
      default: return 'text-gray-400 fill-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      default: return 'Offline';
    }
  };

  return (
    <div className={`p-4 border-t ${
      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className={`flex items-center space-x-2 mb-3 text-sm font-medium ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <Users className="w-4 h-4" />
        <span>Members ({users.length})</span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((user) => (
          <div 
            key={user.id} 
            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <div className="relative">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.username}
                className="w-8 h-8 rounded-full"
              />
              <Circle className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                getStatusColor(user.status)
              } ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className={`text-sm font-medium truncate ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {user.username}
                </p>
                {user.id === currentUser?.id && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </div>
              <p className={`text-xs ${getStatusColor(user.status).split(' ')[0]}`}>
                {getStatusText(user.status)}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                className={`p-1 rounded transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-600 text-gray-400' 
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
                title="Send direct message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-600 text-gray-400' 
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <p className={`text-sm text-center py-4 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            No users online
          </p>
        )}
      </div>
    </div>
  );
};

export default UserList;