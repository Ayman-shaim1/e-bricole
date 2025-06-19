import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import StyledCard from "./StyledCard";
import StyledHeading from "./StyledHeading";
import StyledText from "./StyledText";
import StyledLabel from "./StyledLabel";
import Avatar from "./Avatar";
import { formatDate, formatDateWithTime } from "../utils/dateUtils";
import { colors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import StyledButton from "./StyledButton";
import { styles as mystyles } from "../constants/styles";
import { getArtisanById } from "../services/userService";

export default function ArtisanApplicationCard({ application }) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [artisanData, setArtisanData] = useState(null);
  const [loading, setLoading] = useState(false);

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setLoading(true);

    const data = await getArtisanById(application?.artisan?.$id);
    setArtisanData(data);
    setLoading(false);
  };
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setArtisanData(null);
  };

  return (
    <>
      <StyledCard style={styles.applicationCard}>
        {/* Header with artisan info */}
        <View style={styles.headerSection}>
          <View style={styles.artisanInfo}>
            <Avatar
              source={application?.artisan?.profileImage}
              text={application?.artisan?.name}
            />
            <View style={styles.artisanDetails}>
              <StyledHeading
                text={application?.artisan?.name || "Unknown Artisan"}
                style={styles.artisanName}
              />
              <StyledText
                text={`Applied ${formatDateWithTime(application?.$createdAt)}`}
                style={[styles.applicationDate, { color: theme.textColor }]}
              />
            </View>
          </View>
        </View>

        {/* Duration section */}
        <View style={styles.section}>
          <StyledLabel
            text="Project Duration"
            style={styles.sectionTitle}
            color="primary"
          />
          <View
            style={[
              styles.durationRow,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <View style={styles.durationItem}>
              <StyledText
                text="Original"
                style={[styles.durationLabel, { color: theme.textColor }]}
              />
              <StyledText
                text={`${application?.serviceRequest?.duration} days`}
                style={[styles.durationValue, { color: theme.textColor }]}
              />
            </View>
            <View style={styles.durationArrow}>
              <StyledText text="→" style={styles.arrowText} color="primary" />
            </View>
            <View style={styles.durationItem}>
              <StyledText
                text="Proposed"
                style={[styles.durationLabel, { color: theme.textColor }]}
              />
              <StyledText
                text={`${application?.newDuration} days`}
                style={[
                  styles.durationValue,
                  { color: colors.primary, fontWeight: "bold" },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Service tasks */}
        {application?.serviceTaskProposals?.length > 0 && (
          <View style={styles.section}>
            <StyledLabel
              text="Service Details"
              style={styles.sectionTitle}
              color="primary"
            />
            {application.serviceTaskProposals.map((proposal, index) => (
              <View
                key={proposal.$id}
                style={[
                  styles.taskItem,
                  { backgroundColor: theme.backgroundColor },
                ]}
              >
                <StyledText
                  text={proposal.serviceTask.title}
                  style={styles.taskTitle}
                  color="primary"
                />
                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <StyledText
                      text="Original"
                      style={[styles.priceLabel, { color: theme.textColor }]}
                    />
                    <StyledText
                      text={`$${proposal.serviceTask.price}`}
                      style={[styles.priceValue, { color: theme.textColor }]}
                    />
                  </View>
                  {Number(proposal.serviceTask.price) !==
                    Number(proposal.newPrice) && (
                    <>
                      <View style={styles.priceArrow}>
                        <StyledText
                          text="→"
                          style={styles.arrowText}
                          color="primary"
                        />
                      </View>
                      <View style={styles.priceItem}>
                        <StyledText
                          text="Proposed"
                          style={[
                            styles.priceLabel,
                            { color: theme.textColor },
                          ]}
                        />
                        <StyledText
                          text={`$${proposal.newPrice}`}
                          style={[
                            styles.priceValue,
                            { color: colors.primary, fontWeight: "bold" },
                          ]}
                        />
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Message section */}
        <View style={styles.section}>
          <StyledLabel
            text="Message from Artisan"
            style={styles.sectionTitle}
            color="primary"
          />
          <View
            style={[
              styles.messageContainer,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <StyledText
              text={application?.message}
              style={[styles.messageText, { color: theme.textColor }]}
            />
          </View>
        </View>

        {/* Start date */}
        <View style={styles.section}>
          <View
            style={[
              styles.startDateRow,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <StyledLabel
              text="Planned Start Date"
              style={[styles.startDateLabel, { color: theme.textColor }]}
            />
            <StyledText
              text={formatDate(application?.startDate)}
              style={styles.startDateValue}
              color="primary"
            />
          </View>
        </View>

        {/* Show Profile Button */}
        <View style={styles.buttonSection}>
          <StyledButton
            text="Show Profile"
            onPress={openProfileModal}
            color="primary"
            style={styles.showProfileButton}
          />
        </View>
      </StyledCard>

      {/* Artisan Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeProfileModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.cardColor }]}
          >
            <View style={styles.modalHeader}>
              <StyledHeading text="Artisan Profile" style={styles.modalTitle} />
              <TouchableOpacity
                onPress={closeProfileModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileHeaderSection}>
              <View style={styles.profileHeaderBackground} />
              <View style={styles.profileAvatarContainer}>
                <Avatar
                  source={artisanData?.profileImage}
                  text={artisanData?.name}
                  size={'xl'}
                />
              </View>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <StyledText 
                    text="Loading profile..." 
                    style={[styles.loadingText, { color: theme.textColor }]} 
                  />
                </View>
              ) : artisanData ? (
                <>
                  {/* Profile Name and Email */}
                  <View style={styles.profileNameContainer}>
                    <StyledHeading 
                      text={artisanData.name} 
                      style={[styles.profileName, { color: theme.textColor }]} 
                    />
                    <View style={styles.emailContainer}>
                      <Ionicons name="mail-outline" size={16} color={theme.textColor} />
                      <StyledText 
                        text={artisanData.email} 
                        style={[styles.profileEmail, { color: theme.textColor }]} 
                      />
                    </View>
                  </View>

                  {/* Professional Information */}
                  <StyledCard style={[styles.infoCard, { backgroundColor: theme.backgroundColor }]}>
                    <View style={styles.infoCardHeader}>
                      <MaterialCommunityIcons 
                        name="briefcase-outline" 
                        size={24} 
                        color={colors.primary} 
                      />
                      <StyledHeading 
                        text="Professional Information" 
                        style={[styles.infoCardTitle, { color: theme.textColor }]} 
                      />
                    </View>
                    <View style={styles.infoCardContent}>
                      <View style={styles.infoRow}>
                        <Ionicons name="construct-outline" size={20} color={colors.primary} />
                        <View style={styles.infoTextContainer}>
                          <StyledText 
                            text="Profession" 
                            style={[styles.infoLabel, { color: theme.textColor }]} 
                          />
                          <StyledText 
                            text={artisanData.profession || "Not specified"} 
                            style={[styles.infoValue, { color: theme.textColor }]} 
                          />
                        </View>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <View style={styles.infoTextContainer}>
                          <StyledText 
                            text="Experience" 
                            style={[styles.infoLabel, { color: theme.textColor }]} 
                          />
                          <StyledText 
                            text={`${artisanData.experienceYears || 0} years`} 
                            style={[styles.infoValue, { color: theme.textColor }]} 
                          />
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="wrench-outline" size={20} color={colors.primary} />
                        <View style={styles.infoTextContainer}>
                          <StyledText 
                            text="Service Type" 
                            style={[styles.infoLabel, { color: theme.textColor }]} 
                          />
                          <StyledText 
                            text={artisanData.serviceType?.title || artisanData.serviceType || "Not specified"} 
                            style={[styles.infoValue, { color: theme.textColor }]} 
                          />
                        </View>
                      </View>
                    </View>
                  </StyledCard>

                  {/* Skills */}
                  {artisanData.skills && artisanData.skills.length > 0 && (
                    <StyledCard style={[styles.infoCard, { backgroundColor: theme.backgroundColor }]}>
                      <View style={styles.infoCardHeader}>
                        <MaterialCommunityIcons 
                          name="lightbulb-outline" 
                          size={24} 
                          color={colors.primary} 
                        />
                        <StyledHeading 
                          text="Skills & Expertise" 
                          style={[styles.infoCardTitle, { color: theme.textColor }]} 
                        />
                      </View>
                      <View style={styles.skillsContainer}>
                        {artisanData.skills.map((skill, index) => (
                          <View 
                            key={index} 
                            style={[styles.skillBadge, { backgroundColor: colors.primary + '20' }]}
                          >
                            <StyledText 
                              text={skill} 
                              style={[styles.skillText, { color: colors.primary }]} 
                            />
                          </View>
                        ))}
                      </View>
                    </StyledCard>
                  )}
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <StyledHeading 
                    text="Profile Not Found" 
                    style={[styles.noDataTitle, { color: theme.textColor }]} 
                  />
                  <StyledText 
                    text="Unable to load artisan profile information." 
                    style={[styles.noDataText, { color: theme.textColor }]} 
                  />
                  <StyledButton
                    text="Try Again"
                    onPress={openProfileModal}
                    color="primary"
                    style={styles.noDataButton}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  applicationCard: {
    marginTop: 0,
    padding: 20,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  artisanInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  artisanDetails: {
    marginLeft: 15,
    flex: 1,
  },
  artisanName: {
    fontSize: 18,
    marginBottom: 5,
  },
  applicationDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
  },
  durationItem: {
    alignItems: "center",
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  durationArrow: {
    paddingHorizontal: 10,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  taskItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceItem: {
    alignItems: "center",
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceArrow: {
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  startDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
  },
  startDateLabel: {
    fontSize: 14,
  },
  startDateValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: mystyles.borderRadius,
    overflow: "hidden",
    paddingHorizontal: mystyles.paddingHorizontal,
    paddingVertical: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    flex: 1,
  },
  profileHeaderSection: {
    position: "relative",
    marginBottom: 20,
  },
  profileHeaderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  profileAvatarContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  profileNameContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  profileName: {
    fontSize: 24,
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileEmail: {
    fontSize: 14,
  },
  infoCard: {
    borderRadius: mystyles.borderRadius,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  infoCardTitle: {
    fontSize: 18,
  },
  infoCardContent: {
    gap: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 14,
  },
  actionButtons: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
  },
  debugContainer: {
    padding: 15,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  debugDataContainer: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.primary + "20",
  },
  debugData: {
    fontSize: 12,
  },
  dataSummaryHeader: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
  },
  noDataButton: {
    marginTop: 20,
  },
  dataOverviewContainer: {
    gap: 10,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  dataValue: {
    fontSize: 14,
  },
});
