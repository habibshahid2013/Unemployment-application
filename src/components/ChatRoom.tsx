'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, Chip, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WorkIcon from '@mui/icons-material/Work';
import { subscribeToMessages, sendMessage } from '../lib/db';
import { useAuth } from '../lib/auth';

export default function ChatRoom() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      alert("Please login to chat.");
      return;
    }

    const text = inputText;
    setInputText(''); // Optimistic clear

    await sendMessage(user.id, user.name, text);

    // AI Trigger
    if (text.includes('@AI')) { // 1. Get AI Reply from Python Backend
      try {
        const aiRes = await fetch('/api/v1/ai/chat-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             message: text,
             userName: user.name, // Keep user.name from original, as 'User' is too generic
             context: 'Browsing Community Jobs'
          })
        });
        const data = await aiRes.json();
        if (data.reply) {
             // In a real app the AI would write to DB. Here we proxy the write or append locally.
             // Let's write it to DB as 'ai-agent' so everyone sees it.
             await sendMessage('ai-agent', 'AI Assistant', data.reply);
        }
      } catch (e) {
        console.error("AI failed to respond", e);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Community Chat <Chip size="small" label="Live" color="success" variant="outlined" />
        </Typography>
        <Tooltip title="Ask @AI for help!">
          <SmartToyIcon color="primary" />
        </Tooltip>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#fafafa' }}>
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No messages yet. Start the conversation!
          </Typography>
        )}
        
        {messages.map((msg) => {
          const isMe = user?.id === msg.userId;
          const isAI = msg.userId === 'ai-agent';

          return (
            <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
              {!isMe && (
                <Avatar 
                  sx={{ width: 32, height: 32, mr: 1, bgcolor: isAI ? 'secondary.main' : 'primary.main' }}
                >
                  {isAI ? <SmartToyIcon fontSize="small" /> : msg.userName.charAt(0)}
                </Avatar>
              )}
              
              <Box>
                {!isMe && <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>{msg.userName}</Typography>}
                <Paper sx={{ 
                    p: 1.5, 
                    bgcolor: isMe ? 'primary.main' : (isAI ? 'secondary.light' : 'white'), 
                    color: isMe ? 'white' : 'text.primary',
                    borderRadius: 2,
                    borderTopLeftRadius: !isMe ? 0 : 2,
                    borderTopRightRadius: isMe ? 0 : 2,
                    maxWidth: 300,
                    boxShadow: 1
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                  
                  {/* Job Share Card Embed */}
                  {msg.type === 'job-share' && msg.jobDetails && (
                    <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.9)' }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <WorkIcon color="action" fontSize="small" />
                         <Box>
                           <Typography variant="subtitle2" color="black" fontWeight="bold">{msg.jobDetails.title}</Typography>
                           <Typography variant="caption" color="text.secondary">{msg.jobDetails.company}</Typography>
                         </Box>
                       </Box>
                    </Paper>
                  )}
                </Paper>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
        <TextField 
          fullWidth 
          size="small" 
          placeholder="Type a message or @AI..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!user}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!user || !inputText.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
