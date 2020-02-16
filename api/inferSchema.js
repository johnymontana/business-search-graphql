const neo4j = require("neo4j-driver");
const { inferSchema } = require("neo4j-graphql-js");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const schemaInferenceOptions = {
  alwaysIncludeRelationships: false
};

inferSchema(driver, schemaInferenceOptions).then(result => {
  fs.writeFile("schema.graphql", result.typeDefs, err => {
    if (err) throw err;
    console.log("Updated schema.graphql");
  });
});
