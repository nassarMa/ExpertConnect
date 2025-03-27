import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import Layout from '@/components/Layout';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon
}
from '@mui/icons-material';
import { userAPI } from '@/api';
import io from 'socket.io-client';

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, markMessageRead, loading } = useMessaging();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Fetch contacts (users who have exchanged messages with the current user)
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const response = await userAPI.getUsers();
        setContacts(response.data.filter(contact => contact.id !== user.id));
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };
    
    fetchContacts();
    
    // Set up socket connection
    const socket = io(process.env.API_URL || 'http://localhost:8000', {
      path: '/ws/socket.io',
      transports: ['websocket']
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join', { user_id: user.id });
    });
    
    socket.on('message', (data) => {
      if (
        (data.sender_id === user.id && data.receiver_id === selectedContact?.id) ||
        (data.sender_id === selectedContact?.id && data.receiver_id === user.id)
      ) {
        setChatMessages(prevMessages => [...prevMessages, data]);
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, router, selectedContact]);
  
  useEffect(() => {
    if (selectedContact) {
      const loadMessages = async () => {
        const fetchedMessages = await fetchMessages({ user_id: selectedContact.id });
        setChatMessages(fetchedMessages || []);
        
        // Mark messages as read
        fetchedMessages.forEach(msg => {
          if (msg.sender_id === selectedContact.id && !msg.is_read) {
            markMessageRead(msg.id);
          }
        });
      };
      
      loadMessages();
    }
  }, [selectedContact, fetchMessages, markMessageRead]);
  
  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;
    
    try {
      await sendMessage({
        receiver: selectedContact.id,
        message_content: messageText
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const getUnreadCount = (contactId) => {
    return messages.filter(msg => 
      msg.sender_id === contactId && !msg.is_read
    ).length;
  };
  
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        
        <Grid container spacing={3}>
          {/* Contacts List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: 600, overflow: 'auto' }}>
              <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                Contacts
              </Typography>
              
              {loadingContacts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : contacts.length > 0 ? (
                <List>
                  {contacts.map((contact) => (
                    <ListItem 
                      key={contact.id} 
                      button 
                      selected={selectedContact?.id === contact.id}
                      onClick={() => handleContactSelect(contact)}
                      divider
                    >
                      <ListItemAvatar>
                        <Avatar src={contact.profile_picture || ''}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${contact.first_name} ${contact.last_name}`}
                        secondary={contact.headline || 'User'}
                      />
                      {getUnreadCount(contact.id) > 0 && (
                        <Box 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            borderRadius: '50%', 
                            width: 24, 
                            height: 24, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          {getUnreadCount(contact.id)}
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No contacts found
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => router.push('/experts')}
                  >
                    Find Experts
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Chat Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={selectedContact.profile_picture || ''} sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedContact.first_name} {selectedContact.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedContact.headline || 'User'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Messages */}
                  <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : chatMessages.length > 0 ? (
                      <List>
                        {chatMessages.map((msg) => (
                          <ListItem 
                            key={msg.id}
                            sx={{ 
                              justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                              mb: 1
                            }}
                          >
                            <Box 
                              sx={{ 
                                maxWidth: '70%',
                                bgcolor: msg.sender_id === user.id ? 'primary.light' : 'grey.100',
                                color: msg.sender_id === user.id ? 'white' : 'text.primary',
                                borderRadius: 2,
                                p: 2
                              }}
                            >
                              <Typography variant="body1">
                                {msg.message_content}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                        <div ref={messagesEndRef} />
                      </List>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body1" color="text.secondary">
                          No messages yet. Start the conversation!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Message Input */}
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              color="primary" 
                              onClick={handleSendMessage}
                              disabled={!messageText.trim()}
                            >
                              <SendIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="h6" color="text.secondary">
                    Select a contact to start messaging
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
