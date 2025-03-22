import { createContext, useState, useEffect, useContext } from 'react';
import { messagingAPI } from '../api';

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = async (params = {}) => {
    try {
      setLoading(true);
      const response = await messagingAPI.getMessages(params);
      setMessages(response.data);
      return response.data;
    } catch (error) {
      setError('Failed to fetch messages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      setLoading(true);
      const response = await messagingAPI.sendMessage(messageData);
      await fetchMessages({ user_id: messageData.receiver });
      return response.data;
    } catch (error) {
      setError('Failed to send message');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markMessageRead = async (id) => {
    try {
      await messagingAPI.markMessageRead(id);
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const markAllMessagesRead = async (senderId) => {
    try {
      await messagingAPI.markAllMessagesRead(senderId);
      setMessages(messages.map(msg => 
        msg.sender === senderId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await messagingAPI.getNotifications();
      setNotifications(response.data);
      return response.data;
    } catch (error) {
      setError('Failed to fetch notifications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await messagingAPI.markNotificationRead(id);
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await messagingAPI.markAllNotificationsRead();
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <MessagingContext.Provider
      value={{
        messages,
        notifications,
        loading,
        error,
        fetchMessages,
        sendMessage,
        markMessageRead,
        markAllMessagesRead,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => useContext(MessagingContext);

export default MessagingContext;
