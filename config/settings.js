import Constants from "expo-constants";

const settings = {
  dev: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    bucketId: "682cdbfe0034f6665cf5",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    serviceTasksId: "683b8704000a007dff7c",
    serviceRequestsId: "683b844a0009b7325d4e",
    serviceApplicationsId: "6847421200314be69ca7",
    serviceTaskProposalsId: "684743ac0017cbf90147",
    notificationId: "68488815002e7fa7a5e2",
  },
  staging: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    bucketId: "682cdbfe0034f6665cf5",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    serviceTasksId: "683b8704000a007dff7c",
    serviceRequestsId: "683b844a0009b7325d4e",
    serviceApplicationsId: "6847421200314be69ca7",
    serviceTaskProposalsId: "684743ac0017cbf90147",
    notificationId: "68488815002e7fa7a5e2",
  },
  prod: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    bucketId: "682cdbfe0034f6665cf5",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    serviceTasksId: "683b8704000a007dff7c",
    serviceRequestsId: "683b844a0009b7325d4e",
    serviceApplicationsId: "6847421200314be69ca7",
    serviceTaskProposalsId: "684743ac0017cbf90147",
    notificationId: "68488815002e7fa7a5e2",
  },
};

const getCurrentSettings = () => {
  if (__DEV__) return settings.dev;
  if (Constants.manifest.releaseChannel === "staging") return settings.staging;
  return settings.prod;
};

export default getCurrentSettings();
