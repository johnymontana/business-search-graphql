const { ApolloServer } = require("apollo-server-lambda");
const neo4j = require("neo4j-driver");
const { Neo4jGraphQL } = require("@neo4j/graphql");

const typeDefs = /* GraphQL */ `
  type User {
    name: String!
    wrote: [Review] @relationship(type: "WROTE", direction: "OUT")
  }

  type Review {
    date: Date!
    reviewId: String!
    stars: Float!
    text: String
    reviews: [Business] @relationship(type: "REVIEWS", direction: "OUT")
    users: [User] @relationship(type: "WROTE", direction: "IN")
  }

  type Category {
    name: String!
    business: [Business] @relationship(type: "IN_CATEGORY", direction: "IN")
  }

  type Business {
    address: String!
    city: String!
    location: Point!
    name: String!
    state: String!
    in_category: [Category] @relationship(type: "IN_CATEGORY", direction: "OUT")
    reviews: [Review] @relationship(type: "REVIEWS", direction: "IN")
    recommended(first: Int = 1): [Business]
      @cypher(
        statement: """
        MATCH (this)<-[:REVIEWS]-(:Review)<-[:WROTE]-(:User)-[:WROTE]->(:Review)-[:REVIEWS]->(rec:Business)
        WITH rec, COUNT(*) AS score
        RETURN rec ORDER BY score DESC LIMIT $first
        """
      )
  }
`;

const neoSchema = new Neo4jGraphQL({
  typeDefs,
});

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const server = new ApolloServer({
  schema: neoSchema.schema,
  context: ({ event }) => {
    return {
      driver,
      driverConfig: { database: "grandstack" },
    };
  },
  introspection: true,
  playground: true,
});

exports.handler = server.createHandler({
  cors: {
    origin: "*",
    credentials: true,
  },
});
