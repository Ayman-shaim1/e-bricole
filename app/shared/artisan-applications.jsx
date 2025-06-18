import { ActivityIndicator, StyleSheet, View, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../components/ThemedView";
import StyledHeading from "../../components/StyledHeading";
import GoBackButton from "../../components/GoBackButton";
import { getServiceApplications } from "../../services/requestService";
import StyledText from "../../components/StyledText";
import StyledCard from "../../components/StyledCard";
import Avatar from "../../components/Avatar";
import StyledLabel from "../../components/StyledLabel";
import { formatDateWithTime } from "../../utils/dateUtils";
import Divider from "../../components/Divider";

export default function ArtisanApplications() {
  const { requestId } = useLocalSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    const applications = await getServiceApplications(requestId);
    setApplications(applications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);
  return (
    <ThemedView>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <GoBackButton />
        <StyledHeading text="Applications" style={{ marginTop: 5 }} />
      </View>
      {loading && <ActivityIndicator size="large" />}
      {!loading && applications.length === 0 ? (
        <StyledText text="No applications found" />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.$id}
          renderItem={({ item: application }) => {
            return (
              <StyledCard>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Avatar
                    source={{ uri: application?.artisan?.profileImage }}
                    text={application?.artisan?.name}
                  />
                  <StyledHeading
                    text={application?.artisan?.name || "Unknown Artisan"}
                  />
                </View>
                <View
                  style={{
                    marginBottom: 20,
                  }}
                >
                  <StyledLabel
                    text={`your proposed duration : ${application?.serviceRequest?.duration} days`}
                  />
                  <StyledLabel
                    text={`negotiated duration : ${application?.newDuration} days`}
                  />
                </View>
                {application?.serviceTaskProposals?.length > 0 &&
                  application?.serviceTaskProposals.map((proposal) => (
                    <View key={proposal.$id} style={{ marginBottom: 20 }}>
                      <StyledText
                        color={"primary"}
                        text={`${proposal.serviceTask.title}`}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 0,
                        }}
                      >
                        <StyledLabel
                          text={`your proposed price : ${proposal.serviceTask.price}$`}
                        />
                        {Number(proposal.serviceTask.price) !==
                          Number(proposal.newPrice) && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 0,
                            }}
                          >
                            <StyledLabel text="- negotiated price : " />
                            <StyledLabel
                              text={`${proposal.newPrice}$`}
                              color="primary"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                <StyledLabel
                  text={`Message from artisan  (${application?.artisan?.name}): `}
                />
                <StyledText text={application?.message} />
                <Divider />
                <StyledLabel
                  text={
                    formatDateWithTime(application?.$createdAt) || "No date"
                  }
                />
              </StyledCard>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
