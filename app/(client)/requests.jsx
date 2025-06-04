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
  const SCROLL_THRESHOLD = 50; // Seuil de défilement en pixels

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const currentUser = await account.get();
      const result = await getAllRequests(currentUser.$id);
      if (result.success) {
        setRequests(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch requests. Please make sure you are logged in.");
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    const now = Date.now();
    // Empêcher le rafraîchissement si moins de 2 secondes se sont écoulées depuis le dernier rafraîchissement
    if (now - lastRefreshTime.current < 2000) {
      return;
    }
    lastRefreshTime.current = now;
    setRefreshing(true);
    fetchRequests();
  };

  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset } = nativeEvent;
    // Se déclenche uniquement si l'utilisateur a fait défiler plus que le seuil vers le haut
    if (contentOffset.y < -SCROLL_THRESHOLD && !refreshing) {
      onRefresh();
    }
  };

  const renderRequest = ({ item }) => <ClientRequest request={item} />;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size={'large'} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <StyledText text={error} style={styles.error} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StyledHeading text="My Requests" />
      <View style={styles.content}>
        {requests.length === 0 ? (
          <StyledText 
            text="You don't have any requests yet." 
            style={styles.noRequestsText} 
          />
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
});
