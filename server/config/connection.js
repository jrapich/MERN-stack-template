const mongoose = require("mongoose");
const { DeployedEnvironment } = require("../utils");
//simple way to set up mongodb connection
//string passed to constructor will be the name of the db
const deploy = new DeployedEnvironment("template");

mongoose.connect(deploy.mongodb);

module.exports = mongoose.connection;
