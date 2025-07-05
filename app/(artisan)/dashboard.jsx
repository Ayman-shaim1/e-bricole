import {
  StyleSheet,
  ScrollView,
  Dimensions,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import ThemedView from "../../components/ThemedView";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import { BarChart } from "react-native-chart-kit";
import StyledCard from "../../components/StyledCard";
import StyledLabel from "../../components/StyledLabel";
import StyledHeading from "../../components/StyledHeading";
import StyledText from "../../components/StyledText";
import {
  getArtisanEarnings,
  getDashboardStats,
  DASHBOARD_PERIODS,
} from "../../services/dashboardService";
import { colors } from "../../constants/colors";

export default function DashboardScreen() {
  const { getCurrentTheme } = useTheme();
  const { user } = useAuth();
  const theme = getCurrentTheme();
  const screenWidth = Dimensions.get("window").width - 32; // Account for padding

  // State pour les données du dashboard
  const [earningsData, setEarningsData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(
    DASHBOARD_PERIODS.DAYS_90.value
  );

  // Load earnings data for the selected period
  const loadEarningsData = async (period) => {
    if (!user?.$id) return;

    try {
      setLoadingEarnings(true);
      const earningsResult = await getArtisanEarnings(user.$id, period);

      if (earningsResult.success) {
        setEarningsData(earningsResult.data);
      } else {
        Alert.alert(
          "Error",
          "Unable to load earnings data: " + earningsResult.error
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while loading earnings: " + error.message
      );
    } finally {
      setLoadingEarnings(false);
    }
  };

  // Load general statistics (independent of period)
  const loadDashboardStats = async () => {
    if (!user?.$id) return;

    try {
      setLoadingStats(true);
      const statsResult = await getDashboardStats(user.$id);

      if (statsResult.success) {
        setDashboardStats(statsResult.data);
      } else {
        Alert.alert("Error", "Unable to load statistics: " + statsResult.error);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while loading statistics: " + error.message
      );
    } finally {
      setLoadingStats(false);
    }
  };

  // Load general statistics on mount
  useEffect(() => {
    loadDashboardStats();
  }, [user?.$id]);

  // Load earnings when period changes
  useEffect(() => {
    loadEarningsData(selectedPeriod);
  }, [user?.$id, selectedPeriod]);

  // Configuration du graphique
  const chartConfig = {
    backgroundGradientFrom: theme.cardColor,
    backgroundGradientTo: theme.cardColor,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Bleu principal
    strokeWidth: 2,
    decimalPlaces: 0,
    barPercentage: 0.7,
    propsForBackgroundLines: {
      strokeDasharray: "", // Lignes continues
      stroke: theme.textColor,
      strokeOpacity: 0.1,
    },
  };

  // Calculer la largeur dynamique basée sur le nombre de données
  const getChartWidth = () => {
    const dataLength = earningsData?.monthlyData?.labels?.length || 1;
    const minWidth = screenWidth;

    // Pour 6 mois maximum, largeur adaptée
    if (dataLength >= 6) {
      return Math.max(minWidth, dataLength * 35);
    }

    return minWidth;
  };

  // Données par défaut si pas encore chargées
  const defaultEarningsData = {
    labels: ["No data"],
    datasets: [
      {
        data: [0],
      },
    ],
  };

  // Fonction pour changer la période
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Header />

        <StyledHeading text="Dashboard" style={styles.title} />

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StyledCard style={[styles.statCard, { marginRight: 2 }]}>
            {loadingStats ? (
              <View style={styles.cardLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <StyledText text="Loading..." style={styles.loadingText} />
              </View>
            ) : (
              <>
                <StyledText text="Total Earnings" style={styles.statLabel} />
                <StyledText
                  text={
                    dashboardStats?.totalEarnings
                      ? `$${dashboardStats.totalEarnings.toLocaleString()}`
                      : "$0"
                  }
                  style={styles.statValue}
                  color="primary"
                />
              </>
            )}
          </StyledCard>
          <StyledCard style={[styles.statCard, { marginLeft: 2 }]}>
            {loadingStats ? (
              <View style={styles.cardLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <StyledText text="Loading..." style={styles.loadingText} />
              </View>
            ) : (
              <>
                <StyledText
                  text="Total Accepted Jobs"
                  style={styles.statLabel}
                />
                <StyledText
                  text={dashboardStats?.acceptedApplications?.toString() || "0"}
                  style={styles.statValue}
                  color="primary"
                />
              </>
            )}
          </StyledCard>
        </View>

        {/* Earnings Chart with Period Filter */}
        <StyledCard style={styles.cardContainer}>
          <StyledLabel text="Earnings Evolution" style={styles.cardTitle} />

          {/* Period Selection Buttons */}
          <View style={styles.periodButtonsContainer}>
            {Object.values(DASHBOARD_PERIODS).map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  {
                    borderColor:
                      selectedPeriod === period.value
                        ? colors.primary
                        : theme.backgroundColor === colors.dark.backgroundColor
                        ? colors.darkGray
                        : theme.borderColor,
                    backgroundColor:
                      selectedPeriod === period.value
                        ? colors.primary
                        : theme.backgroundColor === colors.dark.backgroundColor
                        ? colors.dark.cardColor
                        : theme.buttonBackgroundColor,
                  },
                ]}
                onPress={() => handlePeriodChange(period.value)}
              >
                <StyledText
                  text={period.label}
                  style={styles.periodButtonText}
                />
              </TouchableOpacity>
            ))}
          </View>

          {loadingEarnings ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <StyledText text="Loading chart..." style={styles.loadingText} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chartScrollView}
            >
              <BarChart
                data={earningsData?.monthlyData || defaultEarningsData}
                width={getChartWidth()}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </ScrollView>
          )}
        </StyledCard>

        {/* Global Statistics */}
        <StyledCard style={styles.cardContainer}>
          <StyledLabel text="Global Statistics" style={styles.cardTitle} />
          {loadingStats ? (
            <View style={styles.cardLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <StyledText
                text="Loading statistics..."
                style={styles.loadingText}
              />
            </View>
          ) : (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <StyledText
                  text="Total Applications"
                  style={styles.detailLabel}
                />
                <StyledText
                  text={dashboardStats?.totalApplications?.toString() || "0"}
                  style={styles.detailValue}
                />
              </View>
              <View style={styles.detailRow}>
                <StyledText
                  text="Accepted Applications"
                  style={styles.detailLabel}
                />
                <StyledText
                  text={dashboardStats?.acceptedApplications?.toString() || "0"}
                  style={styles.detailValue}
                />
              </View>
              <View style={styles.detailRow}>
                <StyledText
                  text="Pending Applications"
                  style={styles.detailLabel}
                />
                <StyledText
                  text={dashboardStats?.pendingApplications?.toString() || "0"}
                  style={styles.detailValue}
                />
              </View>
              <View style={styles.detailRow}>
                <StyledText text="Acceptance Rate" style={styles.detailLabel} />
                <StyledText
                  text={`${dashboardStats?.acceptanceRate || 0}%`}
                  style={styles.detailValue}
                  color="primary"
                />
              </View>
            </View>
          )}
        </StyledCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},

  cardLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  chartLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 12,
  },
  periodButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  chartScrollView: {
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
  detailsContainer: {
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
