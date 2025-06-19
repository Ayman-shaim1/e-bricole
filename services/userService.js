import { databases } from "../config/appwrite";
import settings from "../config/settings";

export const getArtisanById = async (artisanId) => {
  try {
    const response = await databases.getDocument(
      settings.dataBaseId,
      settings.usersId,
      artisanId
    );
    return {
      name: response.name,
      email: response.email,
      profileImage: response.profileImage,
      skills: response.skills || [],
      profession: response.profession,
      experienceYears: response.experienceYears,
      profileImageId: response.profileImageId,
      serviceType: response.serviceType,
      isClient: response.isClient,
    };
  } catch (error) {
    console.error("Error fetching artisan data:", error);
    return null;
  }
};
