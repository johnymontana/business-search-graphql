const { ApolloServer } = require("apollo-server-lambda");
const neo4j = require("neo4j-driver");
const { Neo4jGraphQL } = require("@neo4j/graphql");

const typeDefs = /* GraphQL */ `
  type User {
    _id: Long!
    name: String!
    wrote: [Review] @relation(name: "WROTE", direction: OUT)
  }
  type Review {
    _id: Long!
    date: Date!
    reviewId: String!
    stars: Float!
    text: String
    reviews: [Business] @relation(name: "REVIEWS", direction: OUT)
    users: [User] @relation(name: "WROTE", direction: IN)
  }
  type Category {
    _id: Long!
    name: String!
    businesss: [Business] @relation(name: "IN_CATEGORY", direction: IN)
  }
  type Business {
    _id: Long!
    address: String!
    city: String!
    location: Point!
    name: String!
    state: String!
    in_category: [Category] @relation(name: "IN_CATEGORY", direction: OUT)
    reviews: [Review] @relation(name: "REVIEWS", direction: IN)
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
        credentials: true
    }
})
