import { colors } from "../constants/colors";

/**
 * Gets the color for a given status
 * @param {string} status - The status to get color for
 * @returns {string} Color code
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return colors.success;
    case "pending":
      return colors.warning;
    case "in progress":
      return colors.primary;
    case "active":
      return colors.success;
    case "pre-begin":
      return "#FF8C00"; // Orange color for pre-begin status
    case "accepted":
      return colors.success;
    case "refused":
      return colors.error;
    default:
      return colors.primary;
  }
};

/**
 * Gets the icon name for a given status
 * @param {string} status - The status to get icon for
 * @returns {string} Icon name for MaterialCommunityIcons
 */
export const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "check-circle";
    case "pending":
      return "clock-outline";
    case "in progress":
      return "progress-clock";
    case "active":
      return "play-circle";
    case "pre-begin":
      return "play-circle-outline"; // Play icon for pre-begin status
    case "accepted":
      return "check-circle-outline";
    case "refused":
      return "close-circle-outline";
    default:
      return "information";
  }
}; 