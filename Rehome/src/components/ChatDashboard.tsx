import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useUserStore from '../services/state/useUserSessionStore';
import { getMessagesByUserId, getMessagesByItemId, markMessagesAsRead, subscribeToUserMessages, sendMessage, MarketplaceMessage } from '../services/marketplaceMessageService';
import { FaEnvelope, FaEnvelopeOpen, FaExclamationTriangle} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
// import { useTranslation } from 'react-i18next';
import API_ENDPOINTS from '../lib/api/config';

interface Conversation {
  itemId: string;
  itemName: string;
  otherUser: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ItemDetails {
  id: string;
  name: string;
}

const ChatDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemsDetails, setItemsDetails] = useState<{[key: string]: ItemDetails}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);
  const location = useLocation();

  // Fetch item details 
  const fetchItemDetails = async (itemIds: string[]) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const uniqueIds = [...new Set(itemIds)]; // Remove duplicates
      
      // Fetch details for each item
      const itemsData: {[key: string]: ItemDetails} = {};
      
      for (const id of uniqueIds) {
        try {
          const response = await axios.get(API_ENDPOINTS.FURNITURE.GET_BY_ID(id), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data) {
            itemsData[id] = {
              id: response.data.id,
              name: response.data.name || `Item #${id}`
            };
          }
        } catch (err) {
          console.error(`Error fetching item ${id}:`, err);
          // Use a default name if we couldn't fetch this item
          itemsData[id] = { id, name: `Item #${id}` };
        }
      }
      
      setItemsDetails(itemsData);
    } catch (err) {
      console.error('Error fetching item details:', err);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for activeItemId in location state to set active conversation
  useEffect(() => {
    if (location.state && location.state.activeItemId) {
      setActiveConversation(location.state.activeItemId);
    }
  }, [location]);

  // Fetch all messages and group them by conversation
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allMessages = await getMessagesByUserId(user.email);
        
        if (allMessages.length === 0) {
          setLoading(false);
          return;
        }
        
        // Group messages by item_id
        const groupedMessages: { [key: string]: MarketplaceMessage[] } = {};
        const itemIds: string[] = [];
        
        allMessages.forEach(message => {
          if (!groupedMessages[message.item_id]) {
            groupedMessages[message.item_id] = [];
            itemIds.push(message.item_id);
          }
          groupedMessages[message.item_id].push(message);
        });
        
        // Fetch item details to get proper names
        await fetchItemDetails(itemIds);
        
        // Create conversation summaries
        const conversationList: Conversation[] = Object.keys(groupedMessages).map(itemId => {
          const msgs = groupedMessages[itemId];
          if (!msgs || msgs.length === 0) {
            return null;
          }
          
          const sortedMsgs = [...msgs].sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
          const lastMsg = sortedMsgs[0];
          
          // const otherUserId = lastMsg.sender_id === user.email ? lastMsg.receiver_id : lastMsg.sender_id;
          const otherUserName = lastMsg.sender_id === user.email ? lastMsg.receiver_id : lastMsg.sender_name;
          
          const unreadCount = msgs.filter(msg => 
            msg.receiver_id === user.email && !msg.read
          ).length;
          
          return {
            itemId,
            itemName: itemsDetails[itemId]?.name || `Item #${itemId}`,
            otherUser: otherUserName,
            lastMessage: lastMsg.content,
            lastMessageTime: lastMsg.created_at || '',
            unreadCount
          };
        }).filter(conv => conv !== null) as Conversation[];
        
        // Sort by most recent message
        conversationList.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        setConversations(conversationList);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load your messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = subscribeToUserMessages(user.email, (newMsg) => {
      // When a new message arrives, update the conversations list
      setConversations(prevConversations => {
        // Find the conversation for this item
        const existingConvIndex = prevConversations.findIndex(c => c.itemId === newMsg.item_id);
        
        if (existingConvIndex >= 0) {
          // Update the existing conversation
          const updatedConversations = [...prevConversations];
          const conv = updatedConversations[existingConvIndex];
          
          updatedConversations[existingConvIndex] = {
            ...conv,
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.created_at || '',
            unreadCount: conv.unreadCount + (newMsg.receiver_id === user.email ? 1 : 0)
          };
          
          // Move the conversation to the top
          const updatedConv = updatedConversations[existingConvIndex];
          updatedConversations.splice(existingConvIndex, 1);
          updatedConversations.unshift(updatedConv);
          
          return updatedConversations;
        } else {
          // Fetch the item details for this new conversation
          fetchItemDetails([newMsg.item_id]);
          
          // Create a new conversation
          const newConversation: Conversation = {
            itemId: newMsg.item_id,
            itemName: itemsDetails[newMsg.item_id]?.name || `Item #${newMsg.item_id}`,
            otherUser: newMsg.sender_id === user.email ? newMsg.receiver_id : newMsg.sender_name,
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.created_at || '',
            unreadCount: newMsg.receiver_id === user.email ? 1 : 0
          };
          
          return [newConversation, ...prevConversations];
        }
      });
      
      // If this message belongs to the active conversation, add it to the messages list
      // Only add if it's not from the current user (to avoid duplicates since we add sent messages immediately)
      if (activeConversation === newMsg.item_id && newMsg.sender_id !== user.email) {
        setMessages(prev => [...prev, newMsg]);
        
        // Mark the message as read if it's for the current user
        if (newMsg.receiver_id === user.email) {
          markMessagesAsRead(newMsg.item_id, user.email);
        }
      }
    });
    
    return () => {
      if (subscription) {
        subscription();
      }
    };
  }, [user, activeConversation]);
  
  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;
    
    const fetchConversationMessages = async () => {
      try {
        const allMessages = await getMessagesByItemId(activeConversation);
        setMessages(allMessages);
        
        // Mark messages as read
        await markMessagesAsRead(activeConversation, user.email);
        
        // Update the unread count in the conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.itemId === activeConversation 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
        toast.error('Failed to load conversation messages');
      }
    };
    
    fetchConversationMessages();
  }, [activeConversation, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;
    
    setIsSending(true);
    
    const msg: MarketplaceMessage = {
      item_id: activeConversation,
      content: newMessage,
      sender_id: user.email,
      sender_name: user.email,
      receiver_id: conversations.find(c => c.itemId === activeConversation)?.otherUser || '',
    };
    
    try {
      const sentMessage = await sendMessage(msg);
      
      // Immediately add the sent message to the local messages state
      if (sentMessage) {
        setMessages(prevMessages => [...prevMessages, sentMessage]);
        
        // Update the conversation list to show this as the latest message
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(conv => {
            if (conv.itemId === activeConversation) {
              return {
                ...conv,
                lastMessage: newMessage,
                lastMessageTime: sentMessage.created_at || new Date().toISOString()
              };
            }
            return conv;
          });
          
          // Move the active conversation to the top
          const activeConvIndex = updatedConversations.findIndex(c => c.itemId === activeConversation);
          if (activeConvIndex > 0) {
            const activeConv = updatedConversations[activeConvIndex];
            updatedConversations.splice(activeConvIndex, 1);
            updatedConversations.unshift(activeConv);
          }
          
          return updatedConversations;
        });
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Toast notification is handled in the service
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to view your messages.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-2xl mr-2" />
          <h2 className="text-xl font-semibold text-red-600">Error Loading Messages</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your messages...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <FaEnvelope className="text-gray-400 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No Messages Yet</h2>
        <p className="text-gray-500">Start a conversation by messaging someone about an item!</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <div
              key={conversation.itemId}
              onClick={() => setActiveConversation(conversation.itemId)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeConversation === conversation.itemId ? 'bg-orange-50 border-r-2 border-orange-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-900 truncate">{conversation.itemName}</h3>
                {conversation.unreadCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">With: {conversation.otherUser}</p>
              <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(conversation.lastMessageTime).toLocaleDateString()} {new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Messages Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <FaEnvelopeOpen className="text-orange-500 mr-2" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {conversations.find(c => c.itemId === activeConversation)?.itemName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Chat with: {conversations.find(c => c.itemId === activeConversation)?.otherUser}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.sender_id === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user.email
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-800 shadow-sm border'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user.email ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at || '').toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FaEnvelope className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Conversation</h3>
              <p className="text-gray-500">Choose a conversation from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard; 