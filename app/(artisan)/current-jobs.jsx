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
            text="Loading your current jobs..."
            style={[styles.loadingText, { color: theme.textColor }]}
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
          <StyledText
            text={error}
            style={[styles.errorText, { color: theme.textColor }]}
          />
          <StyledButton
            text="Retry"
            onPress={fetchCurrentJobs}
            color="primary"
            style={styles.retryButton}
          />
        </View>
      ) : currentJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={{alignItems: "center"}}>
            <Ionicons name="briefcase-outline" size={64} color={colors.gray} />
          </View>
          <StyledText
            text="No Current Jobs"
            style={[styles.emptyTitle, { color: theme.textColor }]}
          />
          <StyledText
            text="You don't have any active jobs at the moment. Keep applying to new requests!"
            style={[styles.emptyText, { color: theme.textColor }]}
          />
          <StyledButton
            text="Browse Jobs"
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
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
