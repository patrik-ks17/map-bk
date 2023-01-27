const express = require("express");
const app = express();
const ObjectId = require("mongodb").ObjectId;
const bodyParser = require("body-parser");


const cors = require('cors');

app.use(cors({
	origin : 'http://localhost:3000',
	credentials: true,
	methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	headers: 'Origin, Pragma, Cache-control, X-Requested-With, Content-Type, Accept, Authorization'
}));

function getClient() {
  let MongoClient = require("mongodb").MongoClient;
  let uri =
    "mongodb://patrik:nfoGU3FTAyZJtxjl@ac-zmyztoo-shard-00-00.dcwwdiy.mongodb.net:27017,ac-zmyztoo-shard-00-01.dcwwdiy.mongodb.net:27017,ac-zmyztoo-shard-00-02.dcwwdiy.mongodb.net:27017/?ssl=true&replicaSet=atlas-hars5n-shard-0&authSource=admin&retryWrites=true&w=majority";
  return new MongoClient(uri);
}

function getId(raw) {
  try {
    return new ObjectId(raw);
  } catch (error) {
    return "";
  }
}

// get all users
app.get("/users", (req, res) => {
  const client = getClient();
  client.connect(async (err, client) => {
    const collection = client.db("sport_project").collection("users");

    const users = await collection.find().toArray();
    res.send(users);

    client.close();
  });
});

// add new user
app.post("/users", bodyParser.json(), (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password,
    markers: req.body.markers,
  };

  const client = getClient();
  client.connect(async (err, client) => {
    const collection = client.db("sport_project").collection("users");

    const result = await collection.insertOne(user);

    if (!result.insertedId) {
      res.send({ error: "Insert failed" });
      return;
    }
    res.send(user);
    client.close();
  });
});

// delete user
app.delete("/users/:id", (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    res.send({ error: "Invalid id" });
    return;
  }
  const client = getClient();
  client.connect(async (err) => {
    const collection = client.db("sport_project").collection("users");
    const result = await collection.deleteOne({ _id: id });
    if (!result.deletedCount) {
      res.send({ error: "Not found" });
      return;
    }
    res.send({ id: id });
    client.close();
  });
});

//---------------------------------------------------------------
// add new marker to user
app.post("/marker/:id", bodyParser.json(), (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    res.send({ error: "Invalid id" });
    return;
  }
  const client = getClient();
  client.connect(async (err) => {
    const collection = client.db("sport_project").collection("users");
    const result = await collection.updateMany(
      { _id: id },
      {
        $set: {
          markers: req.body,
        },
      },
      { returnDocument: "after" }
    );
    if (!result.ok) {
      res.send({ error: "Not found" });
      return;
    }
    res.send(result.value);
    client.close();
  });
});


//get all markers
app.get("/markers/:id", (req, res) => {
  const id = getId(req.params.id);
	if (!id) {	
		res.send({error: 'Invalid id'});
		return;
	}
  const client = getClient();
  client.connect(async (err, client) => {
    const collection = client.db("sport_project").collection("users");

    const markers = await collection.findOne({_id: id});
    res.send(markers);

    client.close();
  });
});


app.listen(9000);
