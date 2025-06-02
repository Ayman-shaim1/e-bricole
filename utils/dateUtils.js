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