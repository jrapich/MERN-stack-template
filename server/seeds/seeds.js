const db = require("../config/connection");
const { DevLoggingTools } = require("../utils");
const dev = new DevLoggingTools(true);
const { User } = require("../models");

const users = require("./userSeeds.json");

db.once("open", async () => {
  try {
    //only in dev environment for testing purposes
    if (!dev.isProduction) {
      //drops the mongo db
      db.dropDatabase("digital-dj");
      //seed the dev data
      await User.create(users);
      dev.log("Database dropped and reseeded with dev environment data", true);
      process.exit(0);
    }
  } catch (err) {
    //log any errors
    dev.groupError("seed", [err]);
    process.exit(1);
  }
});
