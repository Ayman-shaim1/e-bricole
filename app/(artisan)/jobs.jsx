import { StyleSheet, View, FlatList, RefreshControl, Text } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import ThemedView from "../../components/ThemedView";
import { Ionicons } from '@expo/vector-icons';
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import useGeolocation from "../../hooks/useGeolocation";
import { useAuth } from "../../context/AuthContext";
import { getJobsByLocationAndType, hasUserAppliedToRequest } from "../../services/requestService";
import JobRequest from "../../components/JobRequest";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledAddressPicker from "../../components/StyledAddressPicker";
import { useRouter, useFocusEffect } from "expo-router";
import Divider from "../../components/Divider";

export default function JobsScreen() {
  const themeContext = useTheme();
  const theme = themeContext && themeContext.getCurrentTheme 
    ? themeContext.getCurrentTheme() 
    : colors.light;
  const { location } = useGeolocation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      if ((!selectedLocation && !location) || !user?.serviceType) {
        setLoading(false);
        return;
      }

      const result = await getJobsByLocationAndType(
        {
          latitude: selectedLocation?.latitude || location.latitude,
          longitude: selectedLocation?.longitude || location.longitude,
        },
        user.serviceType.$id
      );

      if (result.success) {
        const jobsWithApplied = await Promise.all(
          result.data.map(async (job) => {
            const alreadyApplied = await hasUserAppliedToRequest(job.$id, user.$id);
            return { ...job, alreadyApplied };
          })
        );
        setJobs(jobsWithApplied);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchJobs();
    }, [location, user?.serviceType, selectedLocation])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [location, user?.serviceType, selectedLocation]);

  const handleLocationPick = (pickedLocation) => {
    setSelectedLocation(pickedLocation.coordinates);
  };

  const handlePress = (jobId) => {
    router.push({
      pathname: "/shared/request-details",
      params: { id: jobId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <StyledHeading text="Available Jobs" />
        <StyledText
          text="Find and manage your service requests"
          style={styles.subtitle}
        />
        <StyledAddressPicker
          coordinates={selectedLocation || location}
          onPick={handleLocationPick}
          style={styles.addressPicker}
          useLabel={false}
        />
      </View>
      <Divider />
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <JobRequest
            request={item}
            distance={item.distance}
            alreadyApplied={item.alreadyApplied}
            onPress={() => handlePress(item.$id)}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme?.primary || '#007AFF']}
            tintColor={theme?.primary || '#007AFF'}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.cardColor || '#F5F5F5' }]}> 
              <Ionicons 
                name={
                  !location && !selectedLocation
                    ? "location-outline"
                    : loading
                    ? "time-outline"
                    : error
                    ? "warning-outline"
                    : "briefcase-outline"
                }
                size={40} 
                color={theme.textColorSecondary || '#9E9E9E'} 
              />
            </View>
            <Text style={[styles.emptyText, { color: theme.textColor || '#757575' }]}>
              {!location && !selectedLocation
                ? "Locating you..."
                : loading
                ? "Loading jobs..."
                : error
                ? "Connection issue"
                : "No jobs available"
              }
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textColorSecondary || '#9E9E9E' }]}>
              {!location && !selectedLocation
                ? "Please allow location access to find nearby jobs"
                : loading
                ? "Searching for jobs in your area"
                : error
                ? "Check your connection and try again"
                : "New job opportunities will appear here when available"
              }
            </Text>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
  },
  addressPicker: {
    marginTop: 10,
    marginBottom: 5,
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

  emptyText: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
