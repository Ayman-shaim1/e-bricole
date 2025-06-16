import { account, databases } from "../config/appwrite";
import { ID } from "react-native-appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";

// The settings import is already the correct environment settings object
// because settings.js exports the result of getCurrentSettings()
const DATABASE_ID = settings.dataBaseId;
const USERS_COLLECTION_ID = settings.usersId;


export async function loginUser({ email, password }) {
  try {
    console.log("Attempting to create email session...");
    
    // First, try to delete any existing session
    try {
      await account.deleteSession("current");
      console.log("Existing session deleted successfully");
    } catch (deleteError) {
      // Ignore errors if no session exists
      console.log("No existing session to delete");
    }

    // Now create a new session
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created successfully:", session.$id);

    console.log("Fetching user data...");
    const user = await account.get();
    console.log("User data fetched successfully:", user.$id);

    // Get user document from database to check role
    try {
      console.log("Fetching user document from database...");
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );
      console.log("User document fetched successfully");

      // Check if the user is a client or artisan
      const isClient = userDoc.isClient === true;
      return { success: true, user, isClient, ...userDoc };
    } catch (dbError) {
      console.error("Error fetching user document:", dbError);
      // If we can't determine the role, default to client
      return { success: true, user, isClient: true };
    }
  } catch (error) {
    console.log("Login error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    return { success: false, error: error.message };
  }
}


/**
 * Register a new user with react-native-appwrite
 *
 * This function takes a two-phase approach:
 * 1. First, it validates and prepares all data (including uploading the profile image)
 * 2. Only after all preparations are successful, it creates the us er account
 */
export async function registerUser({
  name,
  email,
  password,
  isClient,
  profileImage,
  skills,
  serviceType,
  profession,
  experienceYears,
}) {
  let userId = null;
  let uploadedFileId = null;

  try {
    console.log("Starting registration process...");

    // PHASE 1: Upload profile image if provided
    let profileUrl = null;
    let profileId = null;

    if (profileImage) {
      try {
        console.log("Uploading profile image...");
        const uploadResult = await uploadFile(profileImage);
        if (uploadResult.success) {
          profileUrl = uploadResult.fileUrl;
          profileId = uploadResult.fileId;
          uploadedFileId = profileId; // Store for potential rollback
          console.log("Profile image uploaded successfully:", profileId);
        } else {
          throw new Error(uploadResult.error || "Failed to upload profile image");
        }
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError.message);
        throw new Error("Failed to upload profile image: " + uploadError.message);
      }
    }

    // PHASE 2: Create the user account
    console.log("Creating user account...");
    const uniqueId = ID.unique();
    const user = await account.create(uniqueId, email, password, name);
    userId = user.$id;
    console.log("User account created with ID:", userId);

    // PHASE 3: Create a session for the new user
    console.log("Creating user session...");
    const session = await account.createEmailPasswordSession(email, password);
    console.log("User session created successfully");

    // PHASE 4: Prepare user data document
    console.log("Preparing user data...");
    const userData = {
      name,
      email,
      isClient,
    };

    // Add artisan-specific fields if the user is an artisan
    if (!isClient) {
      if (skills && skills.length > 0) userData.skills = skills;
      if (serviceType && serviceType !== "-- select option --") {
        userData.serviceType = serviceType;
      }
      if (profession) userData.profession = profession;
      if (experienceYears) userData.experienceYears = experienceYears;
    }

    // Add profile image data if available
    if (profileUrl && profileId) {
      userData.profileImage = profileUrl;
      userData.profileImageId = profileId;
    }

    // PHASE 5: Validate the user data
    console.log("Validating user data structure...");
    try {
      if (userData.experienceYears !== undefined) {
        const yearsAsInt = parseInt(userData.experienceYears, 10);
        if (isNaN(yearsAsInt)) {
          throw new Error("Experience years must be a valid integer");
        }
        userData.experienceYears = yearsAsInt;
      }
      console.log("User data validation successful");
    } catch (validationError) {
      throw new Error("Data validation error: " + validationError.message);
    }

    // PHASE 6: Create the user document
    try {
      console.log("Creating user document in database...");
      await databases.createDocument(
        settings.dataBaseId,
        settings.usersId,
        userId,
        userData
      );
      console.log("User document created successfully");

      return { success: true, userId };
    } catch (dbError) {
      throw new Error("Failed to create user document: " + dbError.message);
    }
  } catch (error) {
    console.error("Registration error:", error.message);
    
    // ROLLBACK: Clean up any created resources
    try {
      // 1. Delete uploaded file if it exists
      if (uploadedFileId) {
        console.log("Rolling back: Deleting uploaded file...");
        await deleteFile(uploadedFileId);
      }

      // 2. Delete user account if it was created
      if (userId) {
        console.log("Rolling back: Deleting user account...");
        await account.deleteSelf();
      }
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError.message);
    }

    return { success: false, error: error.message };
  }
}



export async function checkSession() {
  try {
    const user = await account.get();
    // Get user document from database to check role
    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      // Check if the user is a client or artisan
      const isClient = userDoc.isClient === true;

      // Merge the user document data with the account data
      const userWithProfile = {
        ...user,
        ...userDoc,
        profileImage: userDoc.profileImage || null,
      };

      return { loggedIn: true, user: userWithProfile, isClient };
    } catch (dbError) {
      console.error("Error fetching user document:", dbError);
      // If we can't determine the role, default to client
      return { loggedIn: true, user, isClient: true };
    }
  } catch (error) {
    return { loggedIn: false };
  }
}

export async function logoutUser() {
  try {
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
