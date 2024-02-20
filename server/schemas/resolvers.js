const { User } = require("../models");
//custom graphql error handlers
const {
  DevLoggingTools,
  AuthTools,
  GraphQLErrorData,
  AuthenticationError,
  QueryError,
  MutationError,
  mongoErrorThrower,
} = require("../utils");
const auth = new AuthTools();
const query = new GraphQLErrorData("query");
const mutation = new GraphQLErrorData("mutation");
//devlogging tools
const dev = new DevLoggingTools(false);

const resolvers = {
  Query: {
    //returns currently logged in user data
    me: async (parent, args, context) => {
      dev.group("me query context", [context.user]);
      query.setReason = "username";
      query.username = context.user.username;
      let user;
      if (context.user) {
        user = await User.findOne({ _id: context.user._id })
          .select({ password: 0, email: 0 })
          .populate("");
      } else {
        query.errorMessage = "no valid user is currently logged in";
        query.statusCode = 401;
        throw new AuthenticationError("me", query);
      }
      if (!user) {
        query.errorMessage = "user not found";
        query.statusCode = 404;
        throw new QueryError("me", query);
      }

      return user;
    },
    //returns specified user data
    user: async (parent, { username }) => {
      dev.multiLog(false, "query user args:", username);
      query.setReason = "username";
      query.username = username;
      let user;
      if (username) {
        user = await User.findOne({ username })
          .select({ password: 0, email: 0 })
          .populate({ path: "sessionList" })
          .exec();
      } else {
        query.errorMessage = "no username provided";
        query.statusCode = 400;
        throw new QueryError("user", query);
      }
      if (!user) {
        query.errorMessage = `username ${username} not found`;
        query.statusCode = 404;
        throw new QueryError("user", query);
      }

      return user;
    },
  },
  Mutation: {
    //allow a user to sign up
    addUser: async (parent, { username, email, password }) => {
      dev.multiLog(
        false,
        "addUser mutation:",
        "username",
        username,
        "email",
        email
      );
      let user;
      mutation.username = username;
      mutation.setReason = "user creation";
      try {
        user = await User.create({
          username: username,
          email: email,
          password: password,
        });
        user = await User.findOne({ username: username });
      } catch (err) {
        dev.groupError("addUser", [err.errors]);
        mongoErrorThrower("addUser", mutation, err);
      }

      user.password = null;
      const token = auth.signToken(user);
      dev.group("token and user", [token, user]);
      return { token, user };
    },
    //delete a user
    deleteUser: async (parent, { email, password }, context) => {
      let user;
      mutation.username = context.user;
      mutation.setReason = "user deletion";
      user = await User.findOne({ email });

      if (!user) {
        mutation.setReason = "email";
        mutation.errorMessage = "no account with that email found";
        mutation.statusCode = 404;
        throw new MutationError("deleteUser", mutation);
      }

      const checkPW = await user.isCorrectPassword(password);

      if (!checkPW) {
        mutation.setReason = "password";
        mutation.errorMessage = "incorrect password";
        mutation.statusCode = 401;
        throw new AuthenticationError("deleteUser", mutation);
      }

      if (user.email !== context.user.email) {
        mutation.setReason = "username";
        mutation.errorMessage =
          "cannot delete this user as you are not this user";
        mutation.statusCode = 401;
        dev.error(
          {
            error: "auth",
            date: Date.now(),
            message: "user attempted to delete a different user",
            requestingUser: context.user._id,
            targetUser: user._id,
          },
          true
        );
        throw new AuthenticationError("deleteUser", mutation);
      }

      let deleteUser;
      if (checkPW && context.user) {
        deleteUser = await User.findOneAndDelete({ email }).select({
          password: 0,
        });
        dev.group("deleted user", [deleteUser]);
      }

      return {
        token: "none",
        deleteUser,
      };
    },
    //allows a user to login. returns JWT auth token
    login: async (parent, { email, password }) => {
      mutation.username = email;
      mutation.setReason = "login";
      const user = await User.findOne({ email });

      if (!user) {
        mutation.setReason = "email";
        mutation.errorMessage = "no account with that email found";
        throw new MutationError("login", mutation);
      }

      const checkPW = await user.isCorrectPassword(password);

      if (!checkPW) {
        mutation.setReason = "password";
        mutation.errorMessage = "incorrect password";
        throw new AuthenticationError("login", mutation);
      }

      user.password = null;
      const token = auth.signToken(user);
      return { token, user };
    },
  },
};

module.exports = resolvers;
