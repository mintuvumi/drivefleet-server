const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("drivefleetDB");

    const carsCollection = database.collection("cars");
    const bookingsCollection = database.collection("bookings");

    // JWT
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({ success: true });
    });

    // Logout
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({ success: true });
    });

    // Add Car
    app.post("/cars", async (req, res) => {
      const car = req.body;

      const result = await carsCollection.insertOne(car);

      res.send(result);
    });

    // All Cars
    app.get("/cars", async (req, res) => {
      const result = await carsCollection.find().toArray();

      res.send(result);
    });

    // Single Car
    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;

      const result = await carsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // My Added Cars
    app.get("/my-cars", async (req, res) => {
      const email = req.query.email;

      const result = await carsCollection
        .find({ ownerEmail: email })
        .toArray();

      res.send(result);
    });

    // Delete Car
    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;

      const result = await carsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // Update Car
    app.patch("/cars/:id", async (req, res) => {
      const id = req.params.id;

      const updatedCar = req.body;

      const result = await carsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            price: Number(updatedCar.price),
            description: updatedCar.description,
            status: updatedCar.status,
            image: updatedCar.image,
            type: updatedCar.type,
            location: updatedCar.location,
          },
        }
      );

      res.send(result);
    });

    // Add Booking
    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);

      res.send(result);
    });

    // My Bookings
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;

      const result = await bookingsCollection
        .find({ userEmail: email })
        .toArray();

      res.send(result);
    });

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log(error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("DriveFleet server is running");
});

app.listen(port, () => {
  console.log(`DriveFleet server running on port ${port}`);
});