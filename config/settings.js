import Constants from "expo-constants";

const settings = {
  dev: {
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
  },
  staging: {
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
  },
  prod: {
    dataBaseId: "682cdbba00195948bbf9",
    usersId: "682cdbc3001f92934aa7",
    servicesTypesId: "682cdbd9002d1fd1dc00",
  },
};

const getCurrentSettings = () => {
  if (__DEV__) return settings.dev;
  if (Constants.manifest.releaseChannel === "staging") return settings.staging;
  return settings.prod;
};

export default getCurrentSettings();
