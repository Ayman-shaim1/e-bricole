import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
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
    setRefreshing(true);
    fetchRequests();
  };

  const renderRequest = ({ item }) => <ClientRequest request={item} />;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator />
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
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
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
});
