import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import StyledCard from "../../components/StyledCard";
import GoBackButton from "../../components/GoBackButton";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { getRequestById } from "../../services/requestService";
import { formatDate } from "../../utils/dateUtils";
import StatusBadge from "../../components/StatusBadge";
import Divider from "../../components/Divider";
import { displayedSplitText } from "../../utils/displayedSplitText";
import { styles as mystyles } from "../../constants/styles";
export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchRequestDetails = async () => {
    try {
      const result = await getRequestById(id);
      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setError(result.error || "Failed to fetch request details");
      }
    } catch (err) {
      setError("Failed to fetch request details. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequestDetails();
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Request ID is missing");
      setLoading(false);
      return;
    }
    fetchRequestDetails();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error || !request) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.errorContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <GoBackButton />
          <StyledText
            text={error || "Request not found"}
            style={styles.error}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <GoBackButton />
            <StyledHeading text={displayedSplitText(request.title, 17)} />
          </View>
          <StatusBadge status={request.status} size="medium" />
        </View>
        <StyledCard>
          <StyledText text={request.description} />
          <Divider />
          <View style={styles.datesContainer}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <StyledText
                text={formatDate(request.startDate)}
                style={styles.dateText}
              />
            </View>
            {request.endDate && (
              <View style={styles.dateItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
                <StyledText
                  text={formatDate(request.endDate)}
                  style={styles.dateText}
                />
              </View>
            )}
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Ionicons name="construct" size={20} color={colors.primary} />
            <StyledHeading
              text={request.serviceType.title}
              style={styles.infoText}
            />
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <StyledText
              text={request.address.textAddress}
              style={styles.infoText}
            />
          </View>
          <View style={styles.imagesContainer}>
            {request.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(image)}
              >
                <Image
                  style={styles.image}
                  source={{ uri: image }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </StyledCard>

        <Modal
          visible={selectedImage !== null}
          transparent={true}
          onRequestClose={() => setSelectedImage(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          >
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>

        {request.serviceTasks &&
          request.serviceTasks.length > 0 &&
          request.serviceTasks.map((task) => (
            <StyledCard key={task.$id}>
              <View style={styles.taskTitleRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={colors.primary}
                />
                <StyledHeading text={task.title} />
              </View>
              <StyledText
                text={task.description}
                style={{ marginVertical: 10 }}
              />
              <View style={styles.priceRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.primary}
                />
                <StyledHeading
                  text={task.price + " $"}
                  style={styles.priceText}
                />
              </View>
            </StyledCard>
          ))}
        {request.serviceTasks && request.serviceTasks.length > 0 && (
          <StyledCard>
            <View style={styles.totalRow}>
              <View style={styles.totalTitleRow}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={colors.primary}
                />
                <StyledText text="Total à payer" style={styles.totalLabel} />
              </View>
              <StyledHeading
                text={
                  request.serviceTasks.reduce(
                    (total, task) => total + task.price,
                    0
                  ) + " $"
                }
                style={styles.totalPrice}
              />
            </View>
          </StyledCard>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  tasksHeading: { marginTop: 30, alignSelf: "center" },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: mystyles.borderRadius,

    elevation: 5,
  },
  tasksSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  taskHeading: {
    fontSize: 20,
    marginLeft: 5,
  },
  taskCard: {
    marginBottom: 10,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  taskDescription: {
    marginLeft: 30,
    marginBottom: 10,
    color: colors.textSecondary,
  },
  taskStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: 30,
  },
  taskStatusText: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  priceText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    borderRadius: mystyles.borderRadius,
    width: Dimensions.get("window").width - 100,
    height: Dimensions.get("window").height - 100,
  },
});
