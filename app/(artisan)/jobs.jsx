import { StyleSheet, View, Text, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import { getJobsByLocationAndType } from "../../services/requestService";
import useGeolocation from "../../hooks/useGeolocation";
import { useAuth } from "../../context/AuthContext";

export default function JobsScreen() {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const {
    location,
    error: locationError,
    isLoading: locationLoading,
  } = useGeolocation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Collect debug information
        const debug = {
          hasUser: !!user,
          hasServiceType: !!user?.serviceType,
          serviceTypeId: user?.serviceType?.$id,
          serviceTypeTitle: user?.serviceType?.title,
          hasLocation: !!location,
          latitude: location?.latitude,
          longitude: location?.longitude,
          locationError: locationError,
          locationLoading: locationLoading,
        };
        setDebugInfo(debug);

        // Check if we have all required data
        if (!user) {
          setError("User not authenticated");
          return;
        }

        if (!user.serviceType) {
          setError("Service type not found for user");
          return;
        }

        if (!location) {
          setError("Location not available");
          return;
        }

        const result = await getJobsByLocationAndType(
          location,
          user.serviceType.$id
        );
        if (result.success) {
          console.log(result.data);
          setJobs(result.data);
        } else {
          setError(result.error || "Failed to fetch jobs");
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("An error occurred while fetching jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [user, location, locationError, locationLoading]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      ></ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  error: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
});
