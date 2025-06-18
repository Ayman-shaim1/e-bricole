/**
 * Formats a date string to a localized French format
 * @param {string} dateString - The date string to format
 * @param {boolean} showTime - Whether to include time in the formatted string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, showTime = false) => {
  const date = new Date(dateString);
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(showTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Formats a date string to dd/mm/yyyy at hh:mm format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string in dd/mm/yyyy at hh:mm format
 */
export const formatDateWithTime = (dateString) => {
  if (!dateString) return "No date";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}; 