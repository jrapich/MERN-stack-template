//require dotenv as soon as possible
require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");
const {
  ApolloServerPluginLandingPageDisabled,
} = require("@apollo/server/plugin/disabled");
const { expressMiddleware } = require("@apollo/server/express4");
const path = require("path");
//custom tools to help with dev and handling graphql errors
const { DevLoggingTools, AuthTools } = require("./utils");
const dev = new DevLoggingTools(true);
const auth = new AuthTools();

const { typeDefs, resolvers } = require("./schemas");
const db = require("./config/connection");

//start the server in deployed environment port, or 3001 for dev purposes
const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    //if we are n production, disable the default graphql landing page at /graphql
    dev.isProduction
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault(),
  ],
  formatError: function ({ message, extensions }) {
    //function will return error object based on a graqhql error thrown. see utils/error.js
    const time = new Date();
    let option;
    extensions.query ? (option = "query") : (option = "mutation");
    dev.groupError(`'${message}' from ${extensions.type} ${option},`, [
      time,
      extensions,
    ]);
    return {
      message: extensions.message,
      reason: extensions.reason,
      code: extensions.code,
      status: extensions.status,
      user: extensions.user,
      time: time,
    };
  },
});

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async () => {
  await server.start();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  //graphql API endpoint
  //middleware method will parse any JWT token in each req, passed as context arg to graphql resolver
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: auth.middleware,
    })
  );

  //if we are in production, serve the built react app on all GET routes
  if (dev.isProduction) {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  //once db is connected, start express server
  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

// Call the async function to start the server
startApolloServer();
