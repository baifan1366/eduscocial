'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { extractMentions } from '@/lib/mentionParser';

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  disabled,
  autoFocus,
  ...props
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [currentMention, setCurrentMention] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // 检测@符号输入
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // 查找当前光标位置前的@符号
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // 检查@符号后是否有空格或其他分隔符
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpace = /\s/.test(textAfterAt);
      
      if (!hasSpace && textAfterAt.length <= 20) {
        // 正在输入用户名
        setCurrentMention(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setShowSuggestions(true);
        
        // 如果有输入内容，搜索用户
        if (textAfterAt.length > 0) {
          searchUsers(textAfterAt);
        } else {
          setSuggestions([]);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
    
    onChange(e);
  };
  
  // 搜索用户
  const searchUsers = async (query) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    
    try {
      // 这里应该调用用户搜索API
      // 暂时使用模拟数据
      const mockUsers = [
        { id: '1', username: 'alice', avatar_url: null },
        { id: '2', username: 'bob', avatar_url: null },
        { id: '3', username: 'charlie', avatar_url: null },
      ].filter(user => user.username.toLowerCase().includes(query.toLowerCase()));
      
      setSuggestions(mockUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    }
  };
  
  // 选择用户
  const selectUser = (user) => {
    if (mentionStartPos === -1) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const currentValue = value;
    const beforeMention = currentValue.substring(0, mentionStartPos);
    const afterCursor = currentValue.substring(textarea.selectionStart);
    
    const newValue = beforeMention + `@${user.username} ` + afterCursor;
    const newCursorPos = mentionStartPos + user.username.length + 2; // +2 for @ and space
    
    // 创建新的事件对象
    const syntheticEvent = {
      target: {
        value: newValue,
        selectionStart: newCursorPos,
        selectionEnd: newCursorPos
      }
    };
    
    onChange(syntheticEvent);
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
    
    setShowSuggestions(false);
    setCurrentMention('');
    setMentionStartPos(-1);
  };
  
  // 键盘导航
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // 这里可以添加键盘导航逻辑
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions.length > 0) {
        selectUser(suggestions[0]);
        e.preventDefault();
      }
    }
  };
  
  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !textareaRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 获取当前提及的用户
  const currentMentions = extractMentions(value);
  
  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        {...props}
      />
      
      {/* 提及建议下拉框 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-[#1E3A5F] border border-[#2E5A8A] rounded-md shadow-lg max-h-40 overflow-y-auto"
        >
          {suggestions.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full px-3 py-2 text-left text-white hover:bg-[#2E5A8A] focus:bg-[#2E5A8A] focus:outline-none flex items-center space-x-2"
              onClick={() => selectUser(user)}
            >
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm">@{user.username}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 当前提及的用户显示 */}
      {currentMentions.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          <span>Mentioning: </span>
          {currentMentions.map((username, index) => (
            <span key={username} className="text-blue-400">
              @{username}
              {index < currentMentions.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
