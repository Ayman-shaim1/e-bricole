import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import useGeolocation from "../../hooks/useGeolocation";
import { useAuth } from "../../context/AuthContext";
import { getJobsByLocationAndType, hasUserAppliedToRequest } from "../../services/requestService";
import JobRequest from "../../components/JobRequest";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledAddressPicker from "../../components/StyledAddressPicker";

export default function JobsScreen() {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const { location } = useGeolocation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

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

  useEffect(() => {
    fetchJobs();
  }, [location, user?.serviceType, selectedLocation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [location, user?.serviceType, selectedLocation]);

  const handleLocationPick = (pickedLocation) => {
    setSelectedLocation(pickedLocation.coordinates);
  };

  if (!theme) {
    return null;
  }

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
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <JobRequest request={item} distance={item.distance} alreadyApplied={item.alreadyApplied} />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={() => (
          <StyledText
            text={
              loading
                ? "Chargement..."
                : error
                ? `Erreur: ${error}`
                : "Aucun job disponible"
            }
            style={{ color: theme.textColor }}
          />
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
});
