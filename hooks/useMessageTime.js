import { useMemo } from 'react';

/**
 * Hook to format message timestamps based on their age
 * @param {string} messageCreatedAt - ISO timestamp from message.$createdAt
 * @returns {string} Formatted time string
 */
export function useMessageTime(messageCreatedAt) {
  return useMemo(() => {
    if (!messageCreatedAt) return '';

    const messageDate = new Date(messageCreatedAt);
    const now = new Date();
    
    // Reset time to start of day for accurate day comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMessageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    const diffInMilliseconds = startOfToday - startOfMessageDay;
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time (HH:MM)
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffInDays === 1) {
      // Yesterday
      return "Yesterday";
    } else if (diffInDays < 7) {
      // This week - show day name (Monday, Tuesday, etc.)
      return messageDate.toLocaleDateString("en-US", { 
        weekday: "long" 
      });
    } else {
      // Older than a week - show date (dd/mm/yyyy)
      const day = messageDate.getDate().toString().padStart(2, '0');
      const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
      const year = messageDate.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }, [messageCreatedAt]);
}

export default useMessageTime; 