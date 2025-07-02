import { databases } from "../config/appwrite";
import { ID, Query } from "appwrite";
import settings from "../config/settings";
import { sendPushNotification } from "./notificationService";
import { getUserById } from "./userService";

/**
 * Sends a message and push notification to a user
 * @param {Object} messageData - The message data
 * @param {string} messageData.senderUser - The ID of the sender
 * @param {string} messageData.receiverUser - The ID of the receiver
 * @param {string} messageData.type - The type of message (e.g., "info", "chat", etc.)
 * @param {string} messageData.messageContent - The content of the message
 * @param {Object} messageData.additionalData - Any additional data for the message (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendMessage(messageData) {
  try {
    // 1. Create the message document in Appwrite
    const messageDoc = {
      senderUser: messageData.senderUser,
      receiverUser: messageData.receiverUser,
      type: messageData.type,
      messageContent: messageData.messageContent,
      ...messageData.additionalData, // Spread any additional data
    };

    const messageResponse = await databases.createDocument(
      settings.dataBaseId,
      settings.messageId,
      ID.unique(),
      messageDoc
    );

        // 2. Get sender and receiver user details for push notification
    try {
      const [senderResult, receiverResult] = await Promise.all([
        getUserById(messageData.senderUser),
        getUserById(messageData.receiverUser)
      ]);
      
      if (receiverResult.success && receiverResult.user && receiverResult.user.expoPushToken) {
        const receiverUser = receiverResult.user;
        const senderUser = senderResult.success ? senderResult.user : null;
        
        // Use sender's name as notification title, fallback to "New Message"
        const notificationTitle = senderUser?.name || "New Message";

        // 3. Send push notification
        await sendPushNotification(
          receiverUser.expoPushToken,
          notificationTitle,
          messageData.messageContent,
          {
            type: "message",
            messageType: messageData.type,
            senderId: messageData.senderUser,
            messageId: messageResponse.$id,
            senderName: senderUser?.name || "Unknown User",
          }
        );
      }
    } catch (pushError) {
      // Don't fail the message creation if push notification fails
    }

    return {
      success: true,
      messageId: messageResponse.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      error: error.message || "Failed to send message",
    };
  }
}

/**
 * Gets messages between two users
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function getMessagesBetweenUsers(user1Id, user2Id) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.messageId,
      [
        Query.or([
          Query.and([
            Query.equal("senderUser", user1Id),
            Query.equal("receiverUser", user2Id),
          ]),
          Query.and([
            Query.equal("senderUser", user2Id),
            Query.equal("receiverUser", user1Id),
          ]),
        ]),
        Query.orderAsc("$createdAt"),
        Query.limit(1000), // Add limit to get more messages (default is 25)
      ]
    );

    // Temporary debug log
    console.log(`Messages retrieved between ${user1Id} and ${user2Id}: ${response.documents.length} messages`);

    return {
      success: true,
      data: response.documents,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Marks a message as read
 * @param {string} messageId - The ID of the message to mark as read
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markMessageAsRead(messageId) {
  try {
    await databases.updateDocument(
      settings.dataBaseId,
      settings.messageId,
      messageId,
      { isSeen: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Marks all unread messages in a conversation as seen
 * @param {string} currentUserId - The current user's ID 
 * @param {string} otherUserId - The other user's ID in the conversation
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markConversationAsRead(currentUserId, otherUserId) {
  try {
    // Get all unread messages where current user is receiver and other user is sender
    const unreadMessages = await databases.listDocuments(
      settings.dataBaseId,
      settings.messageId,
      [
        Query.equal("receiverUser", currentUserId),
        Query.equal("senderUser", otherUserId),
        Query.equal("isSeen", false)
      ]
    );

    // Update all unread messages to seen
    const updatePromises = unreadMessages.documents.map(message => 
      databases.updateDocument(
        settings.dataBaseId,
        settings.messageId,
        message.$id,
        { isSeen: true }
      )
    );

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Marks all unread messages received by the user as seen
 * @param {string} currentUserId - The current user's ID
 * @returns {Promise<{success: boolean, error?: string, updatedCount?: number}>}
 */
export async function markAllReceivedMessagesAsRead(currentUserId) {
  try {
    // Get all unread messages where current user is receiver
    const unreadMessages = await databases.listDocuments(
      settings.dataBaseId,
      settings.messageId,
      [
        Query.equal("receiverUser", currentUserId),
        Query.equal("isSeen", false),
        Query.limit(1000) // Limit to avoid performance issues
      ]
    );

    if (unreadMessages.documents.length === 0) {
      return { 
        success: true, 
        updatedCount: 0 
      };
    }

    // Update all unread messages to seen
    const updatePromises = unreadMessages.documents.map(message => 
      databases.updateDocument(
        settings.dataBaseId,
        settings.messageId,
        message.$id,
        { isSeen: true }
      )
    );

    await Promise.all(updatePromises);

    return { 
      success: true, 
      updatedCount: unreadMessages.documents.length 
    };
  } catch (error) {
    console.error("Error marking all received messages as read:", error);
    return {
      success: false,
      error: error.message,
      updatedCount: 0
    };
  }
}

/**
 * Gets user conversations (like WhatsApp conversations list)
 * Groups messages by unique users and returns the last message from each conversation
 * @param {string} userId - The current user's ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function getUserConversations(userId) {
  try {
    // Get all messages where user is either sender or receiver
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.messageId,
      [
        Query.or([
          Query.equal("senderUser", userId),
          Query.equal("receiverUser", userId),
        ]),
        Query.orderDesc("$createdAt"),
        Query.limit(1000), // Limit to avoid performance issues
      ]
    );

    // Group messages by conversation partner
    const conversationsMap = new Map();

    for (const message of response.documents) {
      // Extract user IDs - handle both string IDs and user objects
      const senderUserId = typeof message.senderUser === 'string' 
        ? message.senderUser 
        : message.senderUser?.$id;
      const receiverUserId = typeof message.receiverUser === 'string' 
        ? message.receiverUser 
        : message.receiverUser?.$id;

      // Determine the other user (conversation partner)
      const otherUserId = senderUserId === userId 
        ? receiverUserId 
        : senderUserId;

      // If this is the first message with this user, or if this message is newer
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          lastMessage: message,
          otherUserId: otherUserId,
          unreadCount: 0,
        });
      }

      // Count unread messages (messages sent to current user that are not seen)
      if (receiverUserId === userId && !message.isSeen) {
        const conversation = conversationsMap.get(otherUserId);
        conversation.unreadCount++;
      }
    }

    // Convert map to array and fetch user details for each conversation partner
    const conversations = [];
    
    for (const [otherUserId, conversationData] of conversationsMap) {
      try {
        // Validate user ID before making the API call
        if (!isValidUserId(otherUserId)) {
          // Create a fallback conversation for invalid user ID
          const lastMessage = conversationData.lastMessage;
          const lastMessageSenderIdInvalid = typeof lastMessage.senderUser === 'string' 
            ? lastMessage.senderUser 
            : lastMessage.senderUser?.$id;
            
          conversations.push({
            id: otherUserId,
            name: `User ${typeof otherUserId === 'string' ? otherUserId.substring(0, 8) : 'Unknown'}...`,
            message: lastMessage.messageContent,
            type: lastMessage.type, // Add message type
            unread: conversationData.unreadCount,
            online: false,
            profession: "User",
            isOutgoing: lastMessageSenderIdInvalid === userId,
            isSeen: lastMessage.isSeen || false,
            lastMessageId: lastMessage.$id,
            lastMessageTime: lastMessage.$createdAt,
            otherUser: null,
            avatar: null,
          });
          continue;
        }

        // Try to get user details from the message objects first (if available)
        const lastMessage = conversationData.lastMessage;
        let otherUser = null;
        
        // Check if user details are already in the message objects
        if (typeof lastMessage.senderUser === 'object' && lastMessage.senderUser?.$id === otherUserId) {
          otherUser = lastMessage.senderUser;
        } else if (typeof lastMessage.receiverUser === 'object' && lastMessage.receiverUser?.$id === otherUserId) {
          otherUser = lastMessage.receiverUser;
        }
        
        // If user details not found in message objects, fetch from API
        if (!otherUser) {
          const userResult = await getUserById(otherUserId);
          
          if (userResult.success && userResult.user) {
            otherUser = userResult.user;
          }
        }
        
        if (otherUser) {
          
          const lastMessageSenderId = typeof lastMessage.senderUser === 'string' 
            ? lastMessage.senderUser 
            : lastMessage.senderUser?.$id;
            
          const conversation = {
            id: otherUserId, // Use other user's ID as conversation ID
            name: otherUser.name || "Unknown User",
            message: lastMessage.messageContent,
            type: lastMessage.type, // Add message type
            unread: conversationData.unreadCount,
            online: false, // We don't have online status yet
            profession: otherUser.serviceType?.title || otherUser.profession || "User",
            isOutgoing: lastMessageSenderId === userId,
            isSeen: lastMessage.isSeen || false,
            lastMessageId: lastMessage.$id,
            lastMessageTime: lastMessage.$createdAt,
            otherUser: otherUser,
            avatar: otherUser.profileImage,
            // Add read status for outgoing messages
            showReadStatus: lastMessageSenderId === userId,
            readStatus: lastMessageSenderId === userId ? (lastMessage.isSeen ? 'seen' : 'sent') : null,
          };
          
          conversations.push(conversation);
        } else {
          // Create a fallback conversation entry for unknown users
          const lastMessageSenderIdFallback = typeof lastMessage.senderUser === 'string' 
            ? lastMessage.senderUser 
            : lastMessage.senderUser?.$id;
            
          const fallbackConversation = {
            id: otherUserId,
            name: "Unknown User",
            message: lastMessage.messageContent,
            type: lastMessage.type, // Add message type
            unread: conversationData.unreadCount,
            online: false,
            profession: "User",
            isOutgoing: lastMessageSenderIdFallback === userId,
            isSeen: lastMessage.isSeen || false,
            lastMessageId: lastMessage.$id,
            lastMessageTime: lastMessage.$createdAt,
            otherUser: null,
            avatar: null,
            // Add read status for outgoing messages
            showReadStatus: lastMessageSenderIdFallback === userId,
            readStatus: lastMessageSenderIdFallback === userId ? (lastMessage.isSeen ? 'seen' : 'sent') : null,
          };
          
          conversations.push(fallbackConversation);
        }
              } catch (error) {
          // Create a fallback conversation entry for failed requests
          const lastMessage = conversationData.lastMessage;
          const lastMessageSenderIdError = typeof lastMessage.senderUser === 'string' 
            ? lastMessage.senderUser 
            : lastMessage.senderUser?.$id;
            
          const errorConversation = {
            id: otherUserId,
            name: "Unknown User",
            message: lastMessage.messageContent,
            type: lastMessage.type, // Add message type
            unread: conversationData.unreadCount,
            online: false,
            profession: "User",
            isOutgoing: lastMessageSenderIdError === userId,
            isSeen: lastMessage.isSeen || false,
            lastMessageId: lastMessage.$id,
            lastMessageTime: lastMessage.$createdAt,
            otherUser: null,
            avatar: null,
            // Add read status for outgoing messages
            showReadStatus: lastMessageSenderIdError === userId,
            readStatus: lastMessageSenderIdError === userId ? (lastMessage.isSeen ? 'seen' : 'sent') : null,
          };
          
          conversations.push(errorConversation);
        }
      }

      // Sort conversations by last message time (newest first)
      conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return {
      success: true,
      data: conversations,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Gets the total count of unread messages for a user
 * @param {string} userId - The current user's ID
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function getUnreadMessagesCount(userId) {
  try {
    // Get all unread messages where current user is receiver
    const unreadMessages = await databases.listDocuments(
      settings.dataBaseId,
      settings.messageId,
      [
        Query.equal("receiverUser", userId),
        Query.equal("isSeen", false),
        Query.limit(1000) // Limit to avoid performance issues
      ]
    );

    return { 
      success: true, 
      count: unreadMessages.documents.length 
    };
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
}

/**
 * Validates if a user ID is in the correct format for Appwrite
 * @param {string} userId - The user ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUserId(userId) {
  // Check if userId exists and is a string
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  // Check length (must be at most 36 characters)
  if (userId.length > 36) {
    return false;
  }
  
  // Check for valid characters (a-z, A-Z, 0-9, underscore)
  // Cannot start with underscore
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/;
  return validPattern.test(userId);
}


