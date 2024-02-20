const typeDefs = `
    type User {
        _id: ID
        username: String!
        email: String
        password: String
    }

    type Auth {
        token: String
        user: User
    }

    type Query {
        me: User
        user(username: String!): User
    }

    type Mutation {
        addUser(username: String!, email: String!, password: String!): Auth
        deleteUser(email: String!, password: String!): Auth
        login(email: String!, password: String!): Auth
    }
`;

module.exports = typeDefs;
