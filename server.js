const express = require("express");
const next = require("next");
const cors = require("cors");
const port = parseInt(process.env.PORT, 10) || 5000;
const dev = process.env.NODE_ENV !== "production";
require("dotenv").config();

// this is for signin
const bcrypt = require("bcrypt");

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = next({ dev });

const handle = app.getRequestHandler();
// mongodb setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@firstcluster.3g9daa6.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// mongodb setup
// check db is connected or not
async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);
// check db is connected or not

app.prepare().then(() => {
  const server = express();

  // move middleware setup code here
  server.use(cors());
  server.use(express.json());

  // signin api
  server.post("/user/signin", async (req, res) => {
    const { email, password, username, name } = req.body;
    const userCollection = client.db("pictolifeDB").collection("users");

    // Check if email exists in the user collection
    const existingUserOne = await userCollection.findOne({ email });
    const existingUserTwo = await userCollection.findOne({ username });
    if (existingUserOne) {
      return res.status(400).json({ email: "Email is already registered" });
    }
    if (existingUserTwo) {
      return res.status(400).json({ username: "Username is already in use" });
    }

    try {
      // Generate a salt for password hashing
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update the user document with the hashed password
      const newUser = {
        email,
        password: hashedPassword,
        username,
        name,
      };
      await userCollection.insertOne(newUser);

      // Return a success response if sign-in is successful
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error hashing password:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // signin api
  server.get("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Pictolife server is running on http://localhost:${port}`);
  });
});
