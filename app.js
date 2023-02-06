const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(cors());
require('dotenv').config();
require("./userDetails");

const JWT_SECRET = process.env.JWT_SECRET
const mongoUrl = process.env.MONGO_URL

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => {
    console.log(e);
  });

const User = mongoose.model("UserInfo");
const Markers = mongoose.model("UserMarkers");

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.send({ error: "User already exists" });
    }
    await User.create({
      username,
      email,
      password: encryptedPassword,
    });
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});

app.post("/login", async (req, res) => {
  const { usern, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: usern }, { username: usern }],
  });
  if (!user) {
    return res.json({ error: "User not found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET);

    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({ error: "error" });
    }
  }
  res.json({ status: "error", error: "Invalid password" });
});

//------------------------------------------------------------------
// add new marker
app.post("/add-marker", async (req, res) => {
  const token = req.body.token;
  const { lat, lng, sport, time } = req.body.selected;

  try {
    if (Object.keys(req.body.selected).length === 0) {
      return res.json({ status: "error", error: "Didn't select a marker" });
    }
    const user = jwt.verify(token, JWT_SECRET);
    const email = user.email;
    const oldMarker = await User.findOne(
      {
        email: email,
        "markers.lat": {
          $in: [lat],
        },
      },
      {
        "markers.$": 1,
      }
    );
    if (oldMarker) {
      return res.json({ status: "error", error: "Marker already exists" });
    }
    const findUser = await User.findOne({ email: email });
    const marker = new Markers({
      lat,
      lng,
      sport,
      time,
    });
    findUser.markers.push(marker);
    findUser.save();
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});

//get user's data
app.post("/get-userdata", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({ email: useremail })
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    res.send({ status: "error", error: error });
  }
});

//get all data
app.post("/get-alldata", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (!user) {
      res.json({ status: "error", error: "Invalid User" });
    }
    User.collection
      .find()
      .toArray()
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    res.send({ status: "error", error: error });
  }
});

// delete a marker
app.post("/delete-marker", async (req, res) => {
  const { token } = req.body;
  const selected = { 
    lat: req.body.selected.lat, 
    lng: req.body.selected.lng,
    sport: req.body.selected.sport,
    time: req.body.selected.time
   };

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const email = user.email;
    const existingMarker = await User.updateOne(
      {
        email: email,
      },
      {
        $pull: { markers: selected },
      }
    )
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
});

app.listen(9000, () => {
  console.log("Server started");
});
