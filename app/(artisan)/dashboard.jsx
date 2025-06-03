import { StyleSheet, ScrollView, Dimensions } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import Header from "../../components/Header";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";
import StyledCard from "../../components/StyledCard";
import StyledLabel from "../../components/StyledLabel";
import StyledHeading from "../../components/StyledHeading";

export default function DashboardScreen() {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const screenWidth = Dimensions.get("window").width - 32; // Account for padding

  // Fake data for earnings line chart
  const earningsData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [2500, 3200, 2800, 4500, 3800, 4200],
      },
    ],
  };

  // Fake data for job distribution pie chart
  const jobDistributionData = [
    {
      name: "Plumbing",
      jobs: 25,
      color: "#FF6384",
      legendFontColor: theme.textColor,
      legendFontSize: 12,
    },
    {
      name: "Electrical",
      jobs: 20,
      color: "#36A2EB",
      legendFontColor: theme.textColor,
      legendFontSize: 12,
    },
    {
      name: "Carpentry",
      jobs: 15,
      color: "#FFCE56",
      legendFontColor: theme.textColor,
      legendFontSize: 12,
    },
    {
      name: "Painting",
      jobs: 10,
      color: "#4BC0C0",
      legendFontColor: theme.textColor,
      legendFontSize: 12,
    },
  ];

  // Fake data for job status bar chart
  const jobStatusData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [30, 15, 8],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.cardColor,
    backgroundGradientTo: theme.cardColor,
    color: (opacity = 1) => theme.textColor,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Header />

        <StyledHeading text="Dashboard" style={styles.title} />

        <StyledCard style={styles.cardContainer}>
          <StyledLabel text="Monthly Earnings ($)" style={styles.cardTitle} />
          <LineChart
            data={earningsData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </StyledCard>

        <StyledCard style={styles.cardContainer}>
          <StyledLabel text="Job Distribution" style={styles.cardTitle} />
          <PieChart
            data={jobDistributionData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="jobs"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </StyledCard>

        <StyledCard style={styles.cardContainer}>
          <StyledLabel text="Job Status" style={styles.cardTitle} />
          <BarChart
            data={jobStatusData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </StyledCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
  },

  title: {
    marginBottom: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
