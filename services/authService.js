import { account, databases } from "../config/appwrite";
import { ID } from "appwrite";
import settings from "../config/settings";
import { uploadFile } from "./uploadService";

// The settings import is already the correct environment settings object
// because settings.js exports the result of getCurrentSettings()
const DATABASE_ID = settings.dataBaseId;
const USERS_COLLECTION_ID = settings.usersId;
/**
 * Register a new user with Appwrite
 *
 * This function takes a two-phase approach:
 * 1. First, it validates and prepares all data (including uploading the profile image)
 * 2. Only after all preparations are successful, it creates the user account
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
  try {
    console.log("Starting registration process...");

    // PHASE 1: Validate and prepare all data before creating the user

    // Step 1: Prepare user data document
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
        // Store the serviceType ID as a relation
        userData.serviceType = serviceType;
      }
      if (profession) userData.profession = profession;
      if (experienceYears) userData.experienceYears = experienceYears;
    }

    // Step 2: Upload profile image if provided (before user creation)
    let profileUrl = null;
    let profileId = null;

    if (profileImage) {
      try {
        console.log("Uploading profile image...");
        const uploadResult = await uploadFile(profileImage);
        if (uploadResult.success) {
          profileUrl = uploadResult.fileUrl;
          profileId = uploadResult.fileId;
          console.log("Profile image uploaded successfully:", profileId);

          // Add image fields to user data - use profileImage as the attribute name
          userData.profileImage = profileUrl;
          userData.profileImageId = profileId;
        } else {
          // If the user specifically provided a profile image but upload failed,
          // we should abort the registration process
          console.error("Error uploading profile image:", uploadResult.error);
          return {
            success: false,
            error: `Profile image upload failed: ${uploadResult.error}`,
          };
        }
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError.message);
        return {
          success: false,
          error: `Profile image upload failed: ${uploadError.message}`,
        };
      }
    }

    // Step 3: Validate the user data structure against the database schema
    // This is a mock validation - in a real app, you might want to query the collection schema
    console.log("Validating user data structure...");
    try {
      // Check if experienceYears is a valid integer if provided
      if (userData.experienceYears !== undefined) {
        const yearsAsInt = parseInt(userData.experienceYears, 10);
        if (isNaN(yearsAsInt)) {
          throw new Error("Experience years must be a valid integer");
        }
        userData.experienceYears = yearsAsInt; // Convert to integer
      }

      // Add more validations as needed
      console.log("User data validation successful");
    } catch (validationError) {
      console.error("Data validation error:", validationError.message);
      return { success: false, error: validationError.message };
    }

    // PHASE 2: Create the user account and database document

    // Step 4: Create the user account in auth
    console.log("Creating user account...");
    const uniqueId = ID.unique();
    const user = await account.create(uniqueId, email, password, name);
    const userId = user.$id;
    console.log("User account created with ID:", userId);

    try {
      // Step 5: Create the user document with all provided information
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
      // If database document creation fails, delete the user account
      console.error("Failed to create user document:", dbError.message);

      try {
        // Create a session to delete the user
        const session = await account.createEmailSession(email, password);
        await account.deleteSession(session.$id);
        // Use the correct method to delete the account
        await account.deleteSelf();
        console.log("Rolled back user creation due to database error");
      } catch (rollbackError) {
        console.error(
          "Failed to rollback user creation:",
          rollbackError.message
        );
      }

      return { success: false, error: dbError.message };
    }
  } catch (error) {
    console.error("Registration error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function loginUser({ email, password }) {
  try {
    const session = await account.createEmailSession(email, password);
    const user = await account.get(); // Fetch user data

    // Get user document from database to check role
    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      // Check if the user is a client or artisan
      const isClient = userDoc.isClient === true;
      return { success: true, user, isClient, ...userDoc };
    } catch (dbError) {
      console.error("Error fetching user document:", dbError);
      // If we can't determine the role, default to client
      return { success: true, user, isClient: true };
    }
  } catch (error) {
    console.log("Login error:", error.message);
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

      console.log("userDoc", userDoc);  

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
