const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(cors());
app.use(express.json());

//jwt validation
const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized access' })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })

}

//Mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();
        const database = client.db('music_master');

        //collection
        const usersCollection = database.collection('users');
        const classCollection = database.collection('classes');
        const ordersCollection = database.collection('orders');

        //jsonwebtoken
        app.post('/jwt', (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
            res.send({ token });
        })



        //popular classes api
        app.get('/popularAllClass', async (req, res) => {
            const result = await classCollection.find().sort({price:-1}).toArray();
            res.send(result);
            
        })
        //All classes api
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })
        app.get('/classes/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidden access' })
            }
            const query = { userEmail: email };
            const result = await classCollection.find(query).toArray();
            res.send(result);
        })
        app.post('/classes', async (req, res) => {
            const data = req.body;
            const result = await classCollection.insertOne(data);
            res.send(result);

        })
        //update ins class data
        app.put('/updateInsData/:id',async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: new ObjectId(id) }
            const updateClass = {
                $set: {
                    name: data.courseName,
                    img: data.img,
                    availableSeats: data.availableSeats,
                    price: data.price
                }
            }
            const result = await classCollection.updateOne(query, updateClass)
            res.send(result);
        })
        app.patch('/makeInstructor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const option = {
                $set: {
                    role:'instructor'
                }
            }
            const result = await usersCollection.updateOne(query, option);
            res.send(result);
        })
        //Admin api
        app.get('/allClasses', verifyJwt, async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })
        //Approved by Admin
        app.patch(`/approved/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const option = {
                $set: {
                    status: 'approved'
                },
            }
            const result = await classCollection.updateOne(query, option);
            res.send(result);
        })
        //Deny by admin
        app.patch(`/deny/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const option = {
                $set: {
                    status: 'deny'
                },
            }
            const result = await classCollection.updateOne(query, option);
            res.send(result);
        })
        //Users api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const alreadyUser = await usersCollection.findOne(query);
            if (!alreadyUser) {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            } else {
                res.send({ message: 'user already exist' });
            }

        })
        app.get('/allUsers', verifyJwt, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })
        app.patch('/makeAdmin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const option = {
                $set: {
                    role:'admin'
                }
            }
            const result = await usersCollection.updateOne(query, option);
            res.send(result);
        })
        // Student api
        app.patch('/student/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const option = {
                $set: {
                    role:'student'
                }
            }
            const result = await usersCollection.updateOne(query, option);
            res.send(result);
        })
        app.post('/selectCurse/', async (req, res) => {
            const ordersData = req.body;
            const result = await ordersCollection.insertOne(ordersData);
            res.send(result);
        })
        app.get('/selectClass/:email',verifyJwt, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidden access' })
            }
            const query = { user: email };
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        })
        //Delete class
        app.delete('/classDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
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

