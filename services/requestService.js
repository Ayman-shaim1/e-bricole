import { databases } from "../config/appwrite";
import { ID, Query } from "appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";
import { createNotification } from "./notificationService";

/**
 * Creates a new address document in the addresses collection
 * @param {Object} addressData - The address data containing coordinates and text address
 * @returns {Promise<{success: boolean, addressId: string|null, error: string|null}>}
 */
export async function createAddress(addressData) {
  try {
    const addressDoc = {
      latitude: addressData.coordinates.latitude,
      longitude: addressData.coordinates.longitude,
      textAddress: addressData.textAddress || "",
    };

    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.addrressessId,
      ID.unique(),
      addressDoc
    );

    return {
      success: true,
      addressId: response.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating address:", error);
    return {
      success: false,
      addressId: null,
      error: error.message,
    };
  }
}

/**
 * Creates multiple service tasks in the serviceTasks collection
 * @param {Array} tasks - Array of task objects containing title, description, and price
 * @returns {Promise<{success: boolean, taskIds: Array<string>, error: string|null}>}
 */
export async function createServiceTasks(tasks) {
  try {
    const taskPromises = tasks.map((task) => {
      const taskDoc = {
        title: task.title,
        description: task.description,
        price: parseFloat(task.price.toString().replace(",", ".")),
        status: "pending",
      };

      return databases.createDocument(
        settings.dataBaseId,
        settings.serviceTasksId,
        ID.unique(),
        taskDoc
      );
    });

    const responses = await Promise.all(taskPromises);
    const taskIds = responses.map((response) => response.$id);

    return {
      success: true,
      taskIds,
      error: null,
    };
  } catch (error) {
    console.error("Error creating service tasks:", error);
    return {
      success: false,
      taskIds: [],
      error: error.message,
    };
  }
}

/**
 * Uploads multiple images in parallel
 * @param {Array} images - Array of image URIs to upload
 * @returns {Promise<{success: boolean, uploadedImages: Array<string>, error: string|null}>}
 */
async function uploadImages(images) {
  try {
    if (!images || images.length === 0) {
      return {
        success: true,
        uploadedImages: [],
        error: null,
      };
    }

    const uploadPromises = images.map((imageUri) => uploadFile(imageUri));
    const results = await Promise.all(uploadPromises);

    // Ne garder que les URLs des images uploadées avec succès
    const uploadedImages = results
      .filter((result) => result.success)
      .map((result) => result.fileUrl);

    return {
      success: true,
      uploadedImages,
      error: null,
    };
  } catch (error) {
    console.error("Error uploading images:", error);
    return {
      success: false,
      uploadedImages: [],
      error: error.message,
    };
  }
}

/**
 * Creates a new service request with tasks, coordinates, and service type
 * @param {Object} requestData - The complete request data
 * @returns {Promise<{success: boolean, requestId: string|null, error: string|null}>}
 */
export async function createServiceRequest(requestData) {
  let uploadedImages = [];
  let createdTaskIds = [];

  try {
    // First, upload all images
    if (requestData.images && requestData.images.length > 0) {
      const imagesResult = await uploadImages(requestData.images);
      if (!imagesResult.success) {
        throw new Error(`Failed to upload images: ${imagesResult.error}`);
      }
      uploadedImages = imagesResult.uploadedImages;
    }

    // Then, create all service tasks
    if (requestData.tasks && requestData.tasks.length > 0) {
      const tasksResult = await createServiceTasks(requestData.tasks);
      if (!tasksResult.success) {
        throw new Error(`Failed to create tasks: ${tasksResult.error}`);
      }
      createdTaskIds = tasksResult.taskIds;
    }

    // Get the text address from the address object
    const textAddress =
      requestData.address?.textAddress ||
      requestData.address?.address ||
      requestData.address?.formattedAddress ||
      "";

    // Finally, create the service request
    const requestDoc = {
      title: requestData.title,
      description: requestData.description,
      duration: requestData.duration,
      totalPrice: parseFloat(
        requestData.totalPrice.toString().replace(",", ".")
      ),
      images: uploadedImages,
      latitude: requestData.address.coordinates.latitude,
      longitude: requestData.address.coordinates.longitude,
      textAddress: textAddress,
      serviceTasks: createdTaskIds,
      serviceType: requestData.serviceType,
      status: "in progress",
      user: requestData.user,
    };

    const response = await databases.createDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      ID.unique(),
      requestDoc
    );

    return {
      success: true,
      requestId: response.$id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating service request:", error);

    // If there was an error, we should clean up any created resources
    try {
      // Delete any uploaded images
      if (uploadedImages.length > 0) {
        // TODO: Implement image deletion from storage
      }

      // Delete any created tasks
      if (createdTaskIds.length > 0) {
        // TODO: Implement task deletion
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    return {
      success: false,
      requestId: null,
      error: error.message,
    };
  }
}

/**
 * Gets all requests for the current user
 * @returns {Promise<Array>}
 */
export async function getUserRequests() {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return [];
  }
}

/**
 * Gets a specific request by ID
 * @param {string} requestId - The ID of the request to fetch
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getRequestById(requestId) {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      requestId
    );
    return {
      success: true,
      data: response,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching request:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Gets all service requests for a specific user
 * @param {string} userId - The ID of the logged-in user
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getAllRequests(userId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId,
      [Query.equal("user", userId), Query.orderDesc("$createdAt")]
    );
    return {
      success: true,
      data: response.documents,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching all requests:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Gets jobs filtered by location and service type within a bounding box
 * @param {Object} location - The artisan's current location {latitude, longitude}
 * @param {string} serviceType - The service type title
 * @param {number} maxDistance - Maximum distance in kilometers (default: 50)
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getJobsByLocationAndType(
  location,
  serviceType,
  maxDistance = 3
) {
  try {
    const lat = location.latitude;
    const lon = location.longitude;

    const latRad = (lat * Math.PI) / 180;
    const cosLat = Math.max(Math.cos(latRad), 0.00001);
    const latDelta = maxDistance / 111;
    const lonDelta = maxDistance / (111 * cosLat);

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceRequestsId,
      [
        Query.equal("status", "in progress"),
        Query.equal("serviceType", serviceType),
        Query.greaterThanEqual("latitude", minLat),
        Query.lessThanEqual("latitude", maxLat),
        Query.greaterThanEqual("longitude", minLon),
        Query.lessThanEqual("longitude", maxLon),
      ]
    );

    // ❗ On applique un vrai filtre de distance ensuite
    const filtered = response.documents.filter((doc) => {
      const d = getDistanceKm(lat, lon, doc.latitude, doc.longitude);
      return d <= maxDistance;
    });

    return {
      success: true,
      data: filtered,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Soumet une candidature d'artisan avec propositions de tâches (transaction complète)
 * @param {Object} data - { newDuration, startDate, message, serviceRequestId, artisanId, clientId, tasks: [{taskId, newPrice}] }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitServiceApplicationWithProposals(data) {
  console.log(
    "Starting submitServiceApplicationWithProposals with data:",
    JSON.stringify(data, null, 2)
  );
  let applicationId;
  let taskProposalIds = [];
  let notificationId;

  try {
    // 1. Format de la date
    let formattedStartDate;
    try {
      formattedStartDate =
        data.startDate instanceof Date
          ? data.startDate.toISOString()
          : new Date(data.startDate).toISOString();
      console.log("Formatted start date:", formattedStartDate);
    } catch (dateError) {
      console.error("Date formatting error:", dateError);
      return { success: false, error: "Format de date invalide" };
    }

    // 2. Create the application document
    const applicationDoc = {
      artisan: data.artisanId,
      client: data.clientId.$id,
      serviceRequest: data.serviceRequestId,
      status: "pending",
      message: data.message,
      startDate: formattedStartDate,
      newDuration: Number(data.newDuration),
    };
    console.log(
      "Creating application document:",
      JSON.stringify(applicationDoc, null, 2)
    );

    const applicationResponse = await databases.createDocument(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      ID.unique(),
      applicationDoc
    );
    applicationId = applicationResponse.$id;
    console.log("Application created successfully with ID:", applicationId);

    // 3. Create task proposals
    console.log(
      "Starting to create task proposals for tasks:",
      JSON.stringify(data.tasks, null, 2)
    );

    for (const task of data.tasks) {
      const taskProposalDoc = {
        serviceApplication: applicationId,
        serviceTask: task.taskId,
        newPrice: parseFloat(task.newPrice.toString().replace(",", ".")),
      };
      console.log(
        "Creating task proposal:",
        JSON.stringify(taskProposalDoc, null, 2)
      );
      const uniqueId = ID.unique();
      console.log("Generated unique ID for task proposal:", uniqueId);

      const taskProposalResponse = await databases.createDocument(
        settings.dataBaseId,
        settings.serviceTaskProposalsId,
        uniqueId,
        taskProposalDoc
      );
      taskProposalIds.push(taskProposalResponse.$id);
      console.log("Task proposal created with ID:", taskProposalResponse.$id);
    }

    // 4. Create notification
    console.log("Creating notification for client:", data.clientId);

    // Fetch service request details first
    const serviceRequestResponse = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      data.serviceRequestId
    );

    const notifRes = await createNotification({
      senderUser: data.artisanId,
      receiverUser: data.clientId.$id,
      title: "New Application Received",
      messageContent: `You have received a new application for "${
        serviceRequestResponse.title
      }" on ${new Date(data.startDate).toLocaleDateString(
        "en-US"
      )} at ${new Date(data.startDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}.`,
      type: "application",
      jsonData: JSON.stringify({
        serviceApplicationId: applicationId,
        serviceRequestId: data.serviceRequestId,
      }),
    });

    notificationId = notifRes.notificationId;
    console.log("Notification created with ID:", notificationId);

    console.log("Service application submitted successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error(
      "Error submitting service application with proposals:",
      error
    );

    // Rollback: Delete all created documents in reverse order
    try {
      console.log("Starting rollback process...");
      if (notificationId) {
        console.log("Deleting notification:", notificationId);
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.notificationId,
          notificationId
        );
      }

      for (const taskProposalId of taskProposalIds) {
        console.log("Deleting task proposal:", taskProposalId);
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.serviceTaskProposalsId,
          taskProposalId
        );
      }

      if (applicationId) {
        console.log("Deleting application:", applicationId);
        await databases.deleteDocument(
          settings.dataBaseId,
          settings.serviceApplicationsId,
          applicationId
        );
      }
      console.log("Rollback completed");
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    return {
      success: false,
      error:
        error.message ||
        "Une erreur est survenue lors de la soumission de la candidature",
    };
  }
}

/**
 * Checks if the artisan has already applied to a specific service request
 * @param {string} serviceRequestId
 * @param {string} artisanId
 * @returns {Promise<boolean>}
 */
export async function hasUserAppliedToRequest(serviceRequestId, artisanId) {
  try {
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("serviceRequest", serviceRequestId),
        Query.equal("artisan", artisanId),
      ]
    );
    return response.documents.length > 0;
  } catch (error) {
    return false; // fallback: allow apply if error
  }
}

/**
 * Gets all service applications for a specific service request
 * @param {string} serviceRequestId - The ID of the service request
 * @returns {Promise<Array>} Array of service application documents
 */
export async function getServiceApplications(serviceRequestId) {
  try {
    let applications = [];
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [Query.equal("serviceRequest", serviceRequestId)]
    );

    for (const application of response.documents) {
      const serviceTaskProposals = await databases.listDocuments(
        settings.dataBaseId,
        settings.serviceTaskProposalsId,
        [Query.equal("serviceApplication", application.$id)]
      );
      applications.push({
        ...application,
        serviceTaskProposals: serviceTaskProposals.documents,
      });
    }

    return applications;
  } catch (error) {
    console.error("Error fetching service applications:", error);
    return [];
  }
}

/**
 * Gets a single service application by ID with its task proposals
 * @param {string} applicationId - The ID of the service application
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getServiceApplicationById(applicationId) {
  try {
    // Get the application document
    const applicationResponse = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      applicationId
    );

    // Get the task proposals for this application
    const serviceTaskProposals = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceTaskProposalsId,
      [Query.equal("serviceApplication", applicationId)]
    );

    // Combine the data
    const application = {
      ...applicationResponse,
      serviceTaskProposals: serviceTaskProposals.documents,
    };

    return {
      success: true,
      data: application,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching service application:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Chooses an artisan for a service request and updates all related statuses
 * @param {string} serviceApplicationId - The ID of the selected service application
 * @param {string} artisanId - The ID of the selected artisan
 * @param {string} currentUserId - The ID of the current user (client)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function chooseArtisan(
  serviceApplicationId,
  artisanId,
  currentUserId
) {
  console.log("Starting chooseArtisan with:", {
    serviceApplicationId,
    artisanId,
    currentUserId,
  });

  let selectedApplication = null;
  let serviceRequestId = null;
  let clientId = null;

  try {
    // 1. Get the selected application details
    const applicationResult = await getServiceApplicationById(
      serviceApplicationId
    );
    if (!applicationResult.success || !applicationResult.data) {
      throw new Error("Failed to fetch application details");
    }

    selectedApplication = applicationResult.data;
    serviceRequestId = selectedApplication.serviceRequest.$id;
    clientId = selectedApplication.client.$id;

    console.log("clientId", clientId);
    console.log("currentUserId", currentUserId);
    // 2. Verify that the current user is the client who created the service request
    if (clientId !== currentUserId) {
      throw new Error(
        "You are not authorized to choose an artisan for this service request"
      );
    }

    // 3. Get the service request to check its status
    const serviceRequest = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      serviceRequestId
    );

    // 4. Verify that the service request is in "in progress" status
    if (serviceRequest.status !== "in progress") {
      throw new Error(
        "This service request is not available for artisan selection"
      );
    }

    console.log("Selected application:", {
      applicationId: selectedApplication.$id,
      serviceRequestId,
      clientId,
      artisanId: selectedApplication.artisan,
    });

    // 5. Get all applications for this service request
    const allApplications = await getServiceApplications(serviceRequestId);
    console.log(`Found ${allApplications.length} total applications`);

    // 6. Update all applications: set selected to "accepted", others to "refused"
    const updatePromises = allApplications.map(async (application) => {
      const newStatus =
        application.$id === serviceApplicationId ? "accepted" : "refused";
      console.log(
        `Updating application ${application.$id} to status: ${newStatus}`
      );

      return databases.updateDocument(
        settings.dataBaseId,
        settings.serviceApplicationsId,
        application.$id,
        { status: newStatus }
      );
    });

    await Promise.all(updatePromises);
    console.log("All applications updated successfully");

    // 7. Update service request status to "pre-begin"
    console.log("Updating service request status to pre-begin");
    await databases.updateDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      serviceRequestId,
      { status: "pre-begin" }
    );

    // 8. Get all service tasks for this request and update their status
    if (serviceRequest.serviceTasks && serviceRequest.serviceTasks.length > 0) {
      console.log(
        `Updating ${serviceRequest.serviceTasks.length} service tasks to pre-begin`
      );

      const taskUpdatePromises = serviceRequest.serviceTasks.map(
        async (task) => {
          return databases.updateDocument(
            settings.dataBaseId,
            settings.serviceTasksId,
            task.$id,
            { status: "pre-begin" }
          );
        }
      );

      await Promise.all(taskUpdatePromises);
      console.log("All service tasks updated successfully");
    }

    // 9. Create notification for the selected artisan
    console.log("Creating notification for selected artisan");
    const notificationResult = await createNotification({
      senderUser: clientId,
      receiverUser: artisanId,
      title: "Application Accepted!",
      messageContent: `Congratulations! Your application for "${serviceRequest.title}" has been accepted. The project is now in pre-begin phase.`,
      type: "application_accepted",
      jsonData: JSON.stringify({
        serviceApplicationId: serviceApplicationId,
        serviceRequestId: serviceRequestId,
        status: "accepted",
      }),
    });

    if (!notificationResult.success) {
      console.warn("Failed to create notification:", notificationResult.error);
    } else {
      console.log("Notification created successfully for selected artisan");
    }

    // 10. Create notifications for rejected artisans
    const rejectedApplications = allApplications.filter(
      (app) => app.$id !== serviceApplicationId
    );
    console.log(
      `Creating notifications for ${rejectedApplications.length} rejected artisans`
    );

    for (const rejectedApp of rejectedApplications) {
      try {
        const rejectNotificationResult = await createNotification({
          senderUser: clientId,
          receiverUser: rejectedApp.artisan,
          title: "Application Update",
          messageContent: `Thank you for your interest in "${serviceRequest.title}". We have selected another artisan for this project.`,
          type: "application_rejected",
          jsonData: JSON.stringify({
            serviceApplicationId: rejectedApp.$id,
            serviceRequestId: serviceRequestId,
            status: "refused",
          }),
        });

        if (!rejectNotificationResult.success) {
          console.warn(
            "Failed to create rejection notification:",
            rejectNotificationResult.error
          );
        }
      } catch (rejectError) {
        console.error("Error creating rejection notification:", rejectError);
      }
    }

    console.log("chooseArtisan completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in chooseArtisan:", error);
    return {
      success: false,
      error: error.message || "Failed to choose artisan",
    };
  }
}

/**
 * Gets current jobs for an artisan (accepted applications)
 * @param {string} artisanId - The ID of the artisan
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getArtisanCurrentJobs(artisanId) {
  try {
    console.log("Fetching current jobs for artisan:", artisanId);
    
    // Get all accepted applications for this artisan
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("artisan", artisanId),
        Query.equal("status", "accepted"),
        Query.orderDesc("$updatedAt")
      ]
    );

    console.log("Found applications:", response.documents.length);
    console.log("Applications:", response.documents.map(app => ({
      id: app.$id,
      status: app.status,
      serviceRequest: app.serviceRequest,
      updatedAt: app.$updatedAt
    })));

    // For each application, get the service request and task proposals
    const jobsWithDetails = await Promise.all(
      response.documents.map(async (application) => {
        try {
          // Extract service request ID - handle both object and direct ID cases
          const serviceRequestId = typeof application.serviceRequest === 'object' 
            ? application.serviceRequest.$id 
            : application.serviceRequest;
          
          console.log("Processing application:", application.$id, "ServiceRequest ID:", serviceRequestId);
          
          // Validate service request ID
          if (!serviceRequestId || typeof serviceRequestId !== 'string' || serviceRequestId.length > 36) {
            console.error("Invalid service request ID:", serviceRequestId);
            return null;
          }
          
          // Get service request details
          const serviceRequest = await databases.getDocument(
            settings.dataBaseId,
            settings.serviceRequestsId,
            serviceRequestId
          );

          // Get task proposals for this application
          const taskProposals = await databases.listDocuments(
            settings.dataBaseId,
            settings.serviceTaskProposalsId,
            [Query.equal("serviceApplication", application.$id)]
          );

          console.log(`Task proposals for application ${application.$id}:`, taskProposals.documents.length);
          console.log("Task proposals details:", JSON.stringify(taskProposals.documents, null, 2));

          return {
            ...application,
            serviceRequest,
            serviceTaskProposals: taskProposals.documents,
          };
        } catch (error) {
          console.error("Error fetching details for application:", application.$id, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed fetches
    const validJobs = jobsWithDetails.filter(job => job !== null);
    
    console.log("Valid jobs with details:", validJobs.length);

    return {
      success: true,
      data: validJobs,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching artisan current jobs:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Debug function to get all applications for an artisan
 * @param {string} artisanId - The ID of the artisan
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function debugArtisanApplications(artisanId) {
  try {
    console.log("Debug: Fetching ALL applications for artisan:", artisanId);
    
    // Get all applications for this artisan (any status)
    const response = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("artisan", artisanId),
        Query.orderDesc("$updatedAt")
      ]
    );

    console.log("Debug: Total applications found:", response.documents.length);
    console.log("Debug: Applications by status:", response.documents.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}));
    
    console.log("Debug: All applications:", response.documents.map(app => ({
      id: app.$id,
      status: app.status,
      serviceRequest: app.serviceRequest,
      createdAt: app.$createdAt,
      updatedAt: app.$updatedAt
    })));

    return {
      success: true,
      data: response.documents,
      error: null,
    };
  } catch (error) {
    console.error("Debug: Error fetching artisan applications:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

/**
 * Gets current job details for an artisan by service request ID
 * @param {string} artisanId - The ID of the artisan
 * @param {string} serviceRequestId - The ID of the service request
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getCurrentJobDetails(artisanId, serviceRequestId) {
  try {
    console.log("Fetching current job details for artisan:", artisanId, "ServiceRequest:", serviceRequestId);
    
    // Get the accepted application for this artisan and service request
    const applicationResponse = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceApplicationsId,
      [
        Query.equal("artisan", artisanId),
        Query.equal("serviceRequest", serviceRequestId),
        Query.equal("status", "accepted")
      ]
    );

    if (applicationResponse.documents.length === 0) {
      console.log("No accepted application found for this job");
      return {
        success: false,
        data: null,
        error: "No accepted application found for this job"
      };
    }

    const application = applicationResponse.documents[0];
    console.log("Found application:", application.$id);

    // Get service request details
    const serviceRequest = await databases.getDocument(
      settings.dataBaseId,
      settings.serviceRequestsId,
      serviceRequestId
    );

    // Get service tasks for this request
    let serviceTasks = [];
    if (serviceRequest.serviceTasks && serviceRequest.serviceTasks.length > 0) {
      const tasksPromises = serviceRequest.serviceTasks.map(async (taskRef) => {
        try {
          // Handle both string IDs and object references
          const taskId = typeof taskRef === 'string' ? taskRef : taskRef.$id;
          
          if (!taskId || taskId.length > 36) {
            console.error("Invalid task ID:", taskId);
            return null;
          }
          
          return await databases.getDocument(
            settings.dataBaseId,
            settings.serviceTasksId,
            taskId
          );
        } catch (error) {
          console.error("Error fetching task:", taskRef, error);
          return null;
        }
      });
      
      const tasksResults = await Promise.all(tasksPromises);
      serviceTasks = tasksResults.filter(task => task !== null);
    }

    // Get task proposals for this application
    const taskProposalsResponse = await databases.listDocuments(
      settings.dataBaseId,
      settings.serviceTaskProposalsId,
      [Query.equal("serviceApplication", application.$id)]
    );

    const taskProposals = taskProposalsResponse.documents;

    // Get client user details
    let clientUser = null;
    if (serviceRequest.user) {
      try {
        // Handle both string IDs and object references
        const userId = typeof serviceRequest.user === 'string' ? serviceRequest.user : serviceRequest.user.$id;
        
        if (userId && userId.length <= 36) {
          clientUser = await databases.getDocument(
            settings.dataBaseId,
            settings.usersId,
            userId
          );
        }
      } catch (error) {
        console.error("Error fetching client user:", error);
        // Continue without client user details
      }
    }

    // Get service type details
    let serviceType = null;
    if (serviceRequest.serviceType) {
      try {
        // Handle both string IDs and object references
        const serviceTypeId = typeof serviceRequest.serviceType === 'string' ? serviceRequest.serviceType : serviceRequest.serviceType.$id;
        
        if (serviceTypeId && serviceTypeId.length <= 36) {
          serviceType = await databases.getDocument(
            settings.dataBaseId,
            settings.servicesTypesId,
            serviceTypeId
          );
        }
      } catch (error) {
        console.error("Error fetching service type:", error);
        // Continue without service type details
      }
    }

    // Combine all data
    const jobDetails = {
      ...application,
      serviceRequest: {
        ...serviceRequest,
        user: clientUser,
        serviceType: serviceType,
        serviceTasks: serviceTasks
      },
      serviceTaskProposals: taskProposals
    };

    console.log("Job details assembled successfully");
    console.log("Service tasks count:", serviceTasks.length);
    console.log("Task proposals count:", taskProposals.length);

    return {
      success: true,
      data: jobDetails,
      error: null
    };

  } catch (error) {
    console.error("Error fetching current job details:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}
