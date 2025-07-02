import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import ClientRequest from "../../components/ClientRequest";
import { getAllRequests } from "../../services/requestService";
import { account } from "../../config/appwrite";
import { colors } from "../../constants/colors";

export default function RequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastRefreshTime = useRef(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setError(null); // Clear any previous errors
      const currentUser = await account.get();
      const result = await getAllRequests(currentUser.$id);
      if (result.success) {
        setRequests(result.data);
        console.log('Requests refreshed from database:', result.data.length, 'items');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch requests. Please make sure you are logged in.");
      console.error('Error fetching requests:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    const now = Date.now();
    // Prevent refresh if less than 1 second has elapsed since last refresh
    if (now - lastRefreshTime.current < 1000) {
      return;
    }
    lastRefreshTime.current = now;
    setRefreshing(true);
    console.log('Refreshing requests from database...');
    fetchRequests();
  };

  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    
    // Trigger refresh when scrolled to the very top with a small pull
    if (contentOffset.y <= -30 && !refreshing && !loading) {
      onRefresh();
    }
  };

  const renderRequest = ({ item }) => <ClientRequest request={item} />;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <StyledHeading text="My Requests" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={'large'} color={colors.primary} />
          <StyledText text="Loading requests..." style={styles.loadingText} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <StyledHeading text="My Requests" />
        <View style={styles.errorContainer}>
          <StyledText text={error} style={styles.error} />
          <StyledText 
            text="Pull down to refresh" 
            style={styles.refreshHint} 
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StyledHeading text="My Requests" />
      <View style={styles.content}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <StyledText 
              text="You don't have any requests yet." 
              style={styles.noRequestsText} 
            />
            <StyledText 
              text="Pull down to refresh" 
              style={styles.refreshHint} 
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={true}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 32,
  },
  error: {
    textAlign: "center",
    marginTop: 20,
    color: colors.error,
  },
  noRequestsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  refreshHint: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
