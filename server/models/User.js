const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const { DevLoggingTools } = require("../utils");
const dev = new DevLoggingTools(false);

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Must have a valid email address!"],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  createdOn: {
    type: Date,
  },
  lastUpdated: {
    type: Date,
  },
});

//if new user, or current user is modified, hash the password
userSchema.pre("save", async function (next) {
  this.isNew || this.isModified("password")
    ? (this.password = await bcrypt.hash(this.password, 15))
    : null;
  this.isNew
    ? ((this.createdOn = new Date()), (this.lastUpdated = new Date()))
    : (this.lastUpdated = new Date());
  next();
});

//TODO: add lots of error handling middleware https://mongoosejs.com/docs/middleware.html

//method to compare a password a user is using to login, against the hashed db password
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.post("validate", function (document) {
  dev.group("post user validate mongoose document:", [document]);
  dev.log(`mongoose: new/existing user validating`, true);
});

const User = model("user", userSchema);

module.exports = User;
