import Constants from "expo-constants";

const settings = {
  dev: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    bucketId: "682cdbfe0034f6665cf5",
  },
  staging: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    bucketId: "682cdbfe0034f6665cf5",
  },
  prod: {
    openRouteApiKey: "5b3ce3597851110001cf62487457825666a7441fbf7b9ac578303d3b",
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
    bucketId: "682cdbfe0034f6665cf5",
  },
};

const getCurrentSettings = () => {
  if (__DEV__) return settings.dev;
  if (Constants.manifest.releaseChannel === "staging") return settings.staging;
  return settings.prod;
};

export default getCurrentSettings();
