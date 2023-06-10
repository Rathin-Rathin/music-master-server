const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(cors());
app.use(express.json());

//Mongodb

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.z5uza0f.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db('music_master');

        //collection
        const usersCollection = database.collection('users');
        const classCollection = database.collection('classes');

        //Classes api
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })
        //Users api
        app.post('/users', async(req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const alreadyUser = await usersCollection.findOne(query);
            if (!alreadyUser) {
                const result = await usersCollection.insertOne(user);
                console.log(result);
                res.send(result);
            } else {
                res.send({ message: 'user already exist' });
                console.log('Already user');
            }
           
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Music-master server is running');
})
app.listen(port, () => {
    console.log('Music master server is running on the port ', port);
})

