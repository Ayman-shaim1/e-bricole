import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledButton from "../../components/StyledButton";
import CurrentJob from "../../components/CurrentJob";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  getArtisanCurrentJobs,
  debugArtisanApplications,
} from "../../services/requestService";

export default function CurrentJobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const [currentJobs, setCurrentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentJobs = async () => {
    try {
      // Check if user exists before making API calls
      if (!user || !user.$id) {
        console.log("No user found, skipping current jobs fetch");
        setCurrentJobs([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setLoading(true);
      setError(null);

      // First, let's debug all applications
      console.log("=== DEBUG: Checking all applications ===");
      const debugResult = await debugArtisanApplications(user.$id);
      console.log("=== END DEBUG ===");

      const result = await getArtisanCurrentJobs(user.$id);

      if (result.success) {
        setCurrentJobs(result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch current jobs");
      }
    } catch (err) {
      console.error("Error fetching current jobs:", err);
      setError("Failed to load current jobs. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCurrentJobs();
  }, []);

  useEffect(() => {
    fetchCurrentJobs();
  }, [user?.$id]);

  const renderJobCard = ({ item: job }) => {
    return <CurrentJob job={job} />;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <StyledHeading text="Current Jobs" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <StyledText
            text="Loading current jobs..."
            style={[
              styles.loadingText,
              { color: theme.textColorSecondary || "#9E9E9E" },
            ]}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <StyledHeading text="Current Jobs" />
        <StyledText
          text={`${currentJobs.length} active job${
            currentJobs.length !== 1 ? "s" : ""
          }`}
          style={[styles.jobCount, { color: theme.textColor }]}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.cardColor || "#F5F5F5" },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={40}
              color={theme.textColorSecondary || "#9E9E9E"}
            />
          </View>
          <StyledText
            text="Connection issue"
            style={[styles.emptyTitle, { color: theme.textColor || "#757575" }]}
          />
          <StyledText
            text="Unable to load your current jobs. Please check your connection."
            style={[
              styles.emptyText,
              { color: theme.textColorSecondary || "#9E9E9E" },
            ]}
          />
          <StyledButton
            text="Try Again"
            onPress={fetchCurrentJobs}
            color="primary"
            style={styles.retryButton}
          />
        </View>
      ) : currentJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.cardColor || "#F5F5F5" },
            ]}
          >
            <Ionicons
              name="briefcase-outline"
              size={40}
              color={theme.textColorSecondary || "#9E9E9E"}
            />
          </View>
          <StyledText
            text="No active jobs"
            style={[styles.emptyTitle, { color: theme.textColor || "#757575" }]}
          />
          <StyledText
            text="Your active jobs will appear here when clients accept your applications"
            style={[
              styles.emptyText,
              { color: theme.textColorSecondary || "#9E9E9E" },
            ]}
          />
          <StyledButton
            text="Browse Jobs"
            style={{ width: "100%" }}
            onPress={() => router.push("/(artisan)/jobs")}
            color="primary"
          />
        </View>
      ) : (
        <FlatList
          data={currentJobs}
          keyExtractor={(item) => item.$id}
          renderItem={renderJobCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  jobCount: {
    fontSize: 14,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  retryButton: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  browseButton: {
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 15,
  },
});
