import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import ThemedView from "../../components/ThemedView";
import Header from "../../components/Header";
import StyledCard from "../../components/StyledCard";
import StyledHeading from "../../components/StyledHeading";
import StyledLabel from "../../components/StyledLabel";
import StyledText from "../../components/StyledText";
import { getServicesTypes } from "../../services/serviceTypesService";

export default function HomeScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchServices = async () => {
      try {
        const data = await getServicesTypes();
        setServices(data);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Header />
        {/* <StyledAddressPicker useLabel={false} /> */}
        <View style={styles.content}>
          <StyledCard>
            <StyledHeading text="Popular Services" style={styles.heading} />
            {loading ? (
              <StyledText text="Loading services..." />
            ) : (
              <View style={styles.servicesContainer}>
                {services.map((service) => (
                  <TouchableOpacity key={service.$id} style={styles.serviceItem}>
                    <StyledLabel text={service.title} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </StyledCard>
          <StyledCard>
            <StyledHeading text="Last requests" style={styles.heading} />
            <View style={styles.requestItem}>
              <View
                style={[styles.statusDot, { backgroundColor: "#4CAF50" }]}
              />
              <View style={styles.requestInfo}>
                <StyledLabel
                  text="Plumbing Repair"
                  style={styles.requestTitle}
                />
                <StyledLabel
                  text="Today, 10:30 AM"
                  style={styles.requestDate}
                />
              </View>
              <StyledLabel text="$85" style={styles.requestPrice} />
            </View>
            <View style={styles.requestItem}>
              <View
                style={[styles.statusDot, { backgroundColor: "#FFC107" }]}
              />
              <View style={styles.requestInfo}>
                <StyledLabel
                  text="Electrical Wiring"
                  style={styles.requestTitle}
                />
                <StyledLabel
                  text="Yesterday, 2:15 PM"
                  style={styles.requestDate}
                />
              </View>
              <StyledLabel text="$120" style={styles.requestPrice} />
            </View>
          </StyledCard>
          <StyledCard>
            <StyledHeading text="Artisan Suggestions" style={styles.heading} />
            <View style={styles.artisanItem}>
              <View style={styles.artisanAvatar}>
                <StyledLabel text="JD" style={styles.avatarText} />
              </View>
              <View style={styles.artisanInfo}>
                <StyledLabel text="John Doe" style={styles.artisanName} />
                <View style={styles.ratingContainer}>
                  <StyledLabel text="4.8" style={styles.rating} />
                  <StyledLabel text="(24 reviews)" style={styles.ratingText} />
                </View>
              </View>
            </View>
            <View style={styles.artisanItem}>
              <View style={styles.artisanAvatar}>
                <StyledLabel text="AS" style={styles.avatarText} />
              </View>
              <View style={styles.artisanInfo}>
                <StyledLabel text="Alex Smith" style={styles.artisanName} />
                <View style={styles.ratingContainer}>
                  <StyledLabel text="4.9" style={styles.rating} />
                  <StyledLabel text="(42 reviews)" style={styles.ratingText} />
                </View>
              </View>
            </View>
          </StyledCard>
        </View>
      </ScrollView>
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
  heading: {
    marginBottom: 12,
  },
  servicesContainer: {
    marginTop: 8,
  },
  serviceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  // Request item styles
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: "#666",
  },
  requestPrice: {
    fontWeight: "600",
    color: "#2e7d32",
  },
  // Artisan item styles
  artisanItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  artisanAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#1976d2",
    fontWeight: "600",
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    color: "#FFA000",
    fontWeight: "600",
    marginRight: 4,
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
  },
});
