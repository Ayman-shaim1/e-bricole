import { ActivityIndicator, StyleSheet, View, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import GoBackButton from "../../components/GoBackButton";
import { getServiceApplications } from "../../services/requestService";
import StyledText from "../../components/StyledText";
import ArtisanApplicationCard from "../../components/ArtisanApplicationCard";
import { colors } from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";

export default function ArtisanApplications() {
  const { requestId } = useLocalSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  const fetchApplications = async () => {
    setLoading(true);
    const applications = await getServiceApplications(requestId);
    setApplications(applications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const renderApplicationCard = ({ item: application }) => {
    return <ArtisanApplicationCard application={application} />;
  };

  return (
    <ThemedView>
      <View style={styles.header}>
        <GoBackButton />
        <StyledHeading text="Applications" style={styles.headerTitle} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <StyledText text="Loading applications..." style={[styles.loadingText, { color: theme.textColor }]} />
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
});
