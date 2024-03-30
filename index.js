const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
// app.use(cors(Credential:true));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const donation = db.collection("donation");
    const leaderboard = db.collection("leaderboard");
    const volunteer = db.collection("volunteer");
    const testimonital = db.collection("testimonital");
    const feedbackMessages = db.collection("feedbackmessages");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    app.get("/api/v1/donation", async (req, res) => {
      try {
        const query = {};
        const result = await donation.find(query).toArray();
        res.status(200).send(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
    app.get("/api/v1/donation/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await donation.findOne(query);
        res.status(200).send(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.post("/api/v1/create-donation", async (req, res) => {
      try {
        const newDonation = req.body;
        const response = await donation.insertOne(newDonation);
        res.send(response);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.delete("/api/v1/delete-donation/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const response = await donation.deleteOne({ _id: new ObjectId(id) });
        console.log(response);
        res.send(response);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.put("/api/v1/update-donation/:id", async (req, res) => {
      const id = req.params.id;
      const updatedDonation = req.body;
      const query = { _id: new ObjectId(id) };
      const last = await donation.findOne(query);

      const updateDoc = {
        $set: updatedDonation,
      };
      console.log(updateDoc);
      const result = await donation.updateOne(query, updateDoc);
      res.send(result);
    });

    //leaderboard...

    app.get("/api/v1/leaderboard", async (req, res) => {
      try {
        const data = await leaderboard.find().toArray();
        res.status(200).send(data);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    //volunteer........

    app.get("/api/v1/volunteer", async (req, res) => {
      try {
        const data = await volunteer.find().toArray();
        res.status(200).send(data);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });
    app.post("/api/v1/createVolunteer", async (req, res) => {
      try {
        const data = req.body;
        const result = await volunteer.insertOne(data);
        res.status(200).send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    //Testomonials..
    app.get("/api/v1/testimonials", async (req, res) => {
      try {
        const result = await testimonital.find().toArray();
        res.status(200).send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });
    app.post("/api/v1/create-testimonials", async (req, res) => {
      const data = req.body;
      try {
        const result = await testimonital.insertOne(data);
        res.status(200).send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    app.get("/api/v1/feedback", async (req, res) => {
      try {
        const result = await feedbackMessages.find().toArray();
        res.status(200).send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    app.post("/api/v1/create-feedback", async (req, res) => {
      try {
        const data = req.body;
        const result = await feedbackMessages.insertOne(data);
        res.status(200).send(result);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
