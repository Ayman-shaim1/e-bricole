import {
  FlatList,
  StyleSheet,
  View,
  ScrollView,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import ThemedView from "../../components/ThemedView";
import { getServicesTypes } from "../../services/serviceTypesService";
import ServiceItem from "../../components/ServiceItem";
import StyledCard from "../../components/StyledCard";
import StyledButton from "../../components/StyledButton";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import StyledHeading from "../../components/StyledHeading";
import StyledLabel from "../../components/StyledLabel";

// Dummy data for featured artisans
const FEATURED_ARTISANS = [
  {
    id: '1',
    name: 'John Smith',
    profession: 'Electrician',
    rating: 4.8,
    reviews: 128,
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    profession: 'Plumber',
    rating: 4.9,
    reviews: 95,
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '3',
    name: 'Mike Wilson',
    profession: 'Carpenter',
    rating: 4.7,
    reviews: 156,
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
];

const ArtisanCard = ({ artisan }) => (
  <View style={styles.artisanCard}>
    <Image source={{ uri: artisan.image }} style={styles.artisanImage} />
    <View style={styles.artisanInfo}>
      <StyledLabel text={artisan.name} style={styles.artisanName} />
      <StyledLabel text={artisan.profession} style={styles.artisanProfession} />
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color={colors.primary} />
        <StyledLabel 
          text={`${artisan.rating} (${artisan.reviews} reviews)`} 
          style={styles.ratingText} 
        />
      </View>
    </View>
  </View>
);

export default function home() {
  const [servicesTypes, setServicesTypes] = useState([]);

  useEffect(() => {
    (async () => {
      const docs = await getServicesTypes();
      setServicesTypes(docs);
    })();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header />

        {/* Popular Services Section */}
        <StyledCard style={styles.servicesContainer}>
          <StyledHeading text={"Popular services"} />
          <View style={styles.servicesWrapper}>
            <FlatList
              data={servicesTypes}
              renderItem={({ item, index }) => (
                <ServiceItem item={item} index={index} />
              )}
              keyExtractor={(item) => item.$id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              snapToInterval={88}
              decelerationRate="fast"
              snapToAlignment="center"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>

          <StyledButton
            text="All Category"
            icon={<Ionicons name="grid" size={16} color={colors.primary} />}
            variant="pill-icon"
            onPress={() => {}}
            textColor="primary"
            color="accentLight2"
          />
        </StyledCard>

        {/* Featured Artisans Section */}
        <StyledCard style={styles.servicesContainer}>
          <StyledHeading text={"Featured Artisans"} />
          <View style={styles.servicesWrapper}>
            <FlatList
              data={FEATURED_ARTISANS}
              renderItem={({ item }) => <ArtisanCard artisan={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              snapToInterval={200}
              decelerationRate="fast"
              snapToAlignment="center"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>

          <StyledButton
            text="View All Artisans"
            icon={<Ionicons name="people" size={16} color={colors.primary} />}
            variant="pill-icon"
            onPress={() => {}}
            textColor="primary"
            color="accentLight2"
          />
        </StyledCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesWrapper: {
    marginBottom: 10,
    marginTop: 3,
  },
  flatListContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  separator: {
    width: 16,
  },
  allCategoryButtonSpacing: {
    marginTop: 8,
  },
  artisanCard: {
    width: 180,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  artisanImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 12,
  },
  artisanInfo: {
    alignItems: 'center',
  },
  artisanName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artisanProfession: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.darkGray,
  },
});
