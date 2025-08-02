import React, { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Lock, Users } from 'lucide-react';

// Simulated backend data using WebSocket-like interaction
const mockRooms = [
  { id: 'tech', name: 'Tech Talk', userCount: 5, description: 'Discuss new tech', isPrivate: false },
  { id: 'fun', name: 'Fun Zone', userCount: 2, description: 'Memes and more', isPrivate: false },
  { id: 'project', name: 'Project Room', userCount: 3, description: 'Project collaboration', isPrivate: true },
];

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const theme = 'light'; // or 'dark'

  useEffect(() => {
    // Simulate backend fetch
    setTimeout(() => {
      setRooms(mockRooms);
    }, 1000);
  }, []);

  const onRoomSelect = (roomId) => {
    setCurrentRoom(roomId);
  };

  const onCreateRoom = () => {
    const newRoom = {
      id: `room-${Date.now()}`,
      name: `New Room ${rooms.length + 1}`,
      userCount: 1,
      description: 'New discussion space',
      isPrivate: false,
    };
    setRooms([...rooms, newRoom]);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Channels
        </h3>
        <button
          onClick={onCreateRoom}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="Create new room"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="relative"
            onMouseEnter={() => setHoveredRoom(room.id)}
            onMouseLeave={() => setHoveredRoom(null)}
          >
            <button
              onClick={() => onRoomSelect(room.id)}
              className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-left transition-all duration-200 group ${
                currentRoom === room.id
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {room.isPrivate ? (
                  <Lock className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium truncate">{room.name}</span>
                    {room.userCount > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        currentRoom === room.id
                          ? 'bg-white/20 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {room.userCount}
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className={`text-xs truncate opacity-75 ${
                      currentRoom === room.id ? 'text-white' : ''
                    }`}>
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {hoveredRoom === room.id && currentRoom !== room.id && (
              <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded shadow-lg p-1`}>
                <button
                  className={`p-1 rounded transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Room info"
                >
                  <Users className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No rooms available</p>
          <button
            onClick={onCreateRoom}
            className="text-sm text-blue-500 hover:text-blue-600 mt-1"
          >
            Create the first room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomList;
