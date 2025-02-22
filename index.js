const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("TaskPro Server is running !");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uk0jw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("taskPro").collection("users");
    const taskCollection = client.db("taskPro").collection("tasks");

    // create user related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // task related api  start -----------------------

    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: body.title,
          category: body.category,
          description: body.description,
        },
      };

      const result = await taskCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          category: body.category,
        },
      };

      const result = await taskCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // Drag & Drop Reorder Tasks API
    app.put("/tasks/reorder", async (req, res) => {
      const { tasks } = req.body;

      try {
        // Clear the existing tasks
        await taskCollection.deleteMany({});

        // Convert task IDs before inserting
        const tasksWithConvertedIds = tasks.map((task) => ({
          ...task,
          _id: convertToObjectId(task._id), // Convert ID for each task
        }));

        // Insert the new order of tasks
        await taskCollection.insertMany(tasksWithConvertedIds);

        res.status(200).send("Tasks reordered successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Error reordering tasks");
      }
    });

    // task related api  end -----------------------
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`TaskPro app listening on port ${port}`);
});
