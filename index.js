const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
require('dotenv').config()
const port = 5000
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b99uy.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const app = express()
app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/burj-al-arab-7c47c-firebase-adminsdk-spq8v-b75d383337.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    
    // post
    app.post('/addBooking',(req, res)=>{
        const newBooking = req.body;
        bookings.insertOne(newBooking)
        .then(result =>{
            res.send(result.insertedCount > 0);
        })
    })
    // get
    app.get('/bookings',(req, res)=>{
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1];
        
            admin.auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    let uid = decodedToken.uid;
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    
                    if (tokenEmail == queryEmail){
                        bookings.find({ email: queryEmail})
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }else{
                        res.status(401).send("Unauthorized Access!");
                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized Access!");
                });
        }else{
            res.status(401).send("Unauthorized Access!")
        }

    })

});

app.listen(port);