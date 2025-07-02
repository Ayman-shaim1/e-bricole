import { databases } from "../config/appwrite";
import { ID, Query } from "appwrite";
import settings from "../config/settings";
import { createNotification } from "./notificationService";
import { sendMessage } from "./messagesService";

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

/**
 * Creates a review for a service request
 * @param {Object} reviewData - The review data
 * @param {string} reviewData.clientId - The ID of the client who is giving the review
 * @param {string} reviewData.artisanId - The ID of the artisan being reviewed
 * @param {string} reviewData.serviceRequestId - The ID of the service request
 * @param {number} reviewData.rating - The rating (0-5)
 * @param {string} reviewData.comment - The review comment
 * @param {string} reviewData.serviceRequestTitle - The title of the service request (for notifications)
 * @returns {Promise<{success: boolean, reviewId?: string, error?: string}>}
 */
export async function createReview(reviewData) {
  try {
    // Debug log to check the review data
    console.log("createReview called with:", {
      clientId: reviewData.clientId,
      artisanId: reviewData.artisanId,
      serviceRequestId: reviewData.serviceRequestId,
      rating: reviewData.rating,
      commentLength: reviewData.comment?.length
    });
    
    // Validate required data
    if (!reviewData.clientId || !reviewData.artisanId || !reviewData.serviceRequestId) {
      throw new Error("Missing required IDs for review creation");
    }
    
    if (!isValidUserId(reviewData.clientId)) {
      throw new Error(`Invalid client ID format: ${reviewData.clientId}`);
    }
    
    if (!isValidUserId(reviewData.artisanId)) {
      throw new Error(`Invalid artisan ID format: ${reviewData.artisanId}`);
    }
    
    if (!isValidUserId(reviewData.serviceRequestId)) {
      throw new Error(`Invalid service request ID format: ${reviewData.serviceRequestId}`);
    }
    
    if (!reviewData.rating || reviewData.rating < 0.5 || reviewData.rating > 5) {
      throw new Error("Rating must be between 0.5 and 5");
    }
    
    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      throw new Error("Comment must be at least 10 characters long");
    }
    
    // 1. Create the review document
    const reviewDoc = {
      client: reviewData.clientId,
      artisan: reviewData.artisanId,
      serviceRequest: reviewData.serviceRequestId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim(),
    };

    const reviewResponse = await databases.createDocument(
      settings.dataBaseId,
      settings.reviewsId,
      ID.unique(),
      reviewDoc
    );

    console.log("Review created successfully:", reviewResponse.$id);

    // 2. Send notification to artisan
    try {
      await createNotification({
        senderUser: reviewData.clientId,
        receiverUser: reviewData.artisanId,
        title: "New Review Received",
        messageContent: `You have received a ${reviewData.rating}-star review for "${reviewData.serviceRequestTitle}". Check your reviews to see the feedback!`,
        type: "review_received",
        jsonData: JSON.stringify({
          reviewId: reviewResponse.$id,
          serviceRequestId: reviewData.serviceRequestId,
          rating: reviewData.rating,
        }),
      });

      console.log("Review notification sent to artisan");
    } catch (notificationError) {
      console.warn("Failed to send review notification:", notificationError);
    }

    // 3. Send info message to artisan
    try {
      await sendMessage({
        senderUser: reviewData.clientId,
        receiverUser: reviewData.artisanId,
        type: "info",
        messageContent: `the client has rated you for the service '${reviewData.serviceRequestTitle}'`,
        isSeen: false,
        jsonData: JSON.stringify({
          reviewId: reviewResponse.$id,
          serviceRequestId: reviewData.serviceRequestId,
          rating: reviewData.rating,
        }),
      });

      console.log("Review info message sent to artisan");
    } catch (messageError) {
      console.warn("Failed to send review info message:", messageError);
    }

    return {
      success: true,
      reviewId: reviewResponse.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating review:", error);
    return {
      success: false,
      error: error.message || "Failed to create review",
    };
  }
}

/**
 * Checks if a client has already reviewed an artisan for a specific service request
 * @param {string} clientId - The ID of the client
 * @param {string} artisanId - The ID of the artisan
 * @param {string} serviceRequestId - The ID of the service request
 * @returns {Promise<{hasReviewed: boolean, review?: Object, error?: string}>}
 */
export async function hasClientReviewedArtisan(clientId, artisanId, serviceRequestId) {
  try {
    // Debug log to check the IDs
    console.log("hasClientReviewedArtisan called with:", {
      clientId,
      artisanId,
      serviceRequestId,
      clientIdType: typeof clientId,
      artisanIdType: typeof artisanId,
      serviceRequestIdType: typeof serviceRequestId
    });
    
    // Validate IDs
    if (!clientId || !artisanId || !serviceRequestId) {
      throw new Error("Missing required IDs for review check");
    }
    
    if (!isValidUserId(clientId)) {
      throw new Error(`Invalid client ID format: ${clientId}`);
    }
    
    if (!isValidUserId(artisanId)) {
      throw new Error(`Invalid artisan ID format: ${artisanId}`);
    }
    
    if (!isValidUserId(serviceRequestId)) {
      throw new Error(`Invalid service request ID format: ${serviceRequestId}`);
    }
    
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.reviewsId,
      [
        Query.equal("client", clientId),
        Query.equal("artisan", artisanId),
        Query.equal("serviceRequest", serviceRequestId),
      ]
    );

    const hasReviewed = response.documents.length > 0;
    const review = hasReviewed ? response.documents[0] : null;

    return {
      hasReviewed,
      review,
      error: null,
    };
  } catch (error) {
    console.error("Error checking if client has reviewed artisan:", error);
    return {
      hasReviewed: false,
      review: null,
      error: error.message,
    };
  }
}

/**
 * Gets all reviews for a specific artisan
 * @param {string} artisanId - The ID of the artisan
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function getArtisanReviews(artisanId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.reviewsId,
      [
        Query.equal("artisan", artisanId),
        Query.orderDesc("$createdAt"),
      ]
    );

    return {
      success: true,
      data: response.documents,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching artisan reviews:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Gets the average rating for an artisan
 * @param {string} artisanId - The ID of the artisan
 * @returns {Promise<{success: boolean, averageRating: number, totalReviews: number, error?: string}>}
 */
export async function getArtisanAverageRating(artisanId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.reviewsId,
      [Query.equal("artisan", artisanId)]
    );

    const reviews = response.documents;
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        success: true,
        averageRating: 0,
        totalReviews: 0,
        error: null,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Round to 1 decimal

    return {
      success: true,
      averageRating,
      totalReviews,
      error: null,
    };
  } catch (error) {
    console.error("Error calculating artisan average rating:", error);
    return {
      success: false,
      averageRating: 0,
      totalReviews: 0,
      error: error.message,
    };
  }
}
