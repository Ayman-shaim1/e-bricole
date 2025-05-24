import { FlatList, StyleSheet, View, ScrollView } from "react-native";
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
            icon={<Ionicons name="grid" size={16} color={colors.white} />}
            variant="pill-icon"
            onPress={() => {}}
            color="primary"
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
});
