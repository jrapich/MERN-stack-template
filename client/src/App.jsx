import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Container, Box } from "@mui/material";
import theme from "./theme";

import { Header, Footer } from "./components";

// Construct our main GraphQL API endpoint
const httpLink = createHttpLink({
  uri: "/graphql",
});

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem("id_token");
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  // Set up our client to execute the `authLink` middleware prior to making the request to our GraphQL API
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App(error) {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Container component="main">
          <Box
            sx={{
              px: 3,
              borderLeft: 6,
              borderRight: 6,
              borderBottom: 6,
              paddingBottom: 2,
              borderRadius: 10,
            }}
          >
            <Box
              sx={{
                px: 1,
                paddingBottom: 1,
                borderLeft: 2,
                borderRight: 2,
                borderBottom: 2,
                borderRadius: 10,
              }}
            >
              {error?.error || <Outlet />}
            </Box>
          </Box>
        </Container>
        <Footer />
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
