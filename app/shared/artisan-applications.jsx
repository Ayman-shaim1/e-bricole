import { ActivityIndicator, StyleSheet, View, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import GoBackButton from "../../components/GoBackButton";
import { getServiceApplications, getRequestById } from "../../services/requestService";
import StyledText from "../../components/StyledText";
import ArtisanApplicationCard from "../../components/ArtisanApplicationCard";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";

export default function ArtisanApplications() {
  const { requestId } = useLocalSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceRequest, setServiceRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const fetchServiceRequest = async () => {
    if (!requestId) return;
    
    try {
      setRequestLoading(true);
      const result = await getRequestById(requestId);
      if (result.success) {
        setServiceRequest(result.data);
      }
    } catch (error) {
      console.error("Error fetching service request:", error);
    } finally {
      setRequestLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    const applications = await getServiceApplications(requestId);
    setApplications(applications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServiceRequest();
    fetchApplications();
  }, [requestId]);

  const handleArtisanChosen = () => {
    // Refresh both the applications list and service request after an artisan is chosen
    fetchApplications();
    fetchServiceRequest();
  };

  const renderApplicationCard = ({ item: application }) => {
    return (
      <ArtisanApplicationCard 
        application={application} 
        onArtisanChosen={handleArtisanChosen}
        serviceRequestStatus={serviceRequest?.status}
      />
    );
  };

  return (
    <ThemedView>
      <View style={styles.header}>
        <GoBackButton />
        <View style={styles.headerContent}>
          <StyledHeading 
            text={serviceRequest?.status === "pre-begin" ? "Selected Artisan" : "Applications"} 
            style={styles.headerTitle} 
          />
          {serviceRequest?.status !== "pre-begin" && applications.length > 0 && (
            <View style={styles.badgeContainer}>
              <StyledText 
                text={`${applications.length} application${applications.length > 1 ? 's' : ''}`}
                style={styles.badgeText}
                color="white"
              />
            </View>
          )}
        </View>
      </View>
      
      {loading || requestLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <StyledText 
            text={requestLoading ? "Loading request details..." : "Loading applications..."} 
            style={[styles.loadingText, { color: theme.textColor }]} 
          />
        </View>
      ) : serviceRequest?.status === "pre-begin" ? (
        <View style={styles.selectedContainer}>
          <StyledText 
            text="An artisan has been selected for this project." 
            style={[styles.selectedText, { color: theme.textColor }]} 
          />
          <StyledText 
            text="The project is now in pre-begin phase." 
            style={[styles.selectedSubtext, { color: theme.textColor }]} 
          />
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <StyledText text="No applications found" style={[styles.emptyText, { color: theme.textColor }]} />
          <StyledText text="Artisans will appear here once they apply" style={[styles.emptySubtext, { color: theme.textColor }]} />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={applications}
          keyExtractor={(item) => item.$id}
          renderItem={renderApplicationCard}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 15,
  },
  selectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  selectedText: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  badgeContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
