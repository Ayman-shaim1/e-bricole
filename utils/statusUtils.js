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
    default:
      return "information";
  }
}; 