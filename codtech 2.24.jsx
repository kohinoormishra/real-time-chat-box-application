import React, { useRef } from 'react';
import { Paperclip, Image, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  theme: 'light' | 'dark';
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
      <button
        type="button"
        onClick={handleClick}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title="Upload file"
      >
        <Paperclip className="w-5 h-5" />
      </button>
    </>
  );
};

export default FileUpload;