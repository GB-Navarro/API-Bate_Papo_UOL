import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.URL_CONNECT_MONGO);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("test");
});

app.use(express.json());
app.use(cors());

let participant = { name: "João", lastStatus: 12313123 };
let message = {
  from: "João",
  to: "Todos",
  text: "oi galera",
  type: "message",
  time: "20:04:37",
};

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/participants", (req, res) => {
  participant.name = req.body.name;
  participant.lastStatus = Date.now();
  res.send("Ok!");
  db.collection("participants")
    .insertOne(participant)
    .then((response) => {
      console.log(response);
    });
});

app.post("/testes", async (req, res) => {
    let username = {name: req.body.name}
    let isNameValid = await usernameValidate(username);
    if(isNameValid){
      res.send("Ok!")
    }else{
      res.sendStatus(409);
    }
})
app.listen(5000);

async function usernameValidate(username){
    let result;
    result = await db.collection("participants").findOne(username)
    console.log(result);
    if(result === null){
        return true;
    }else{
        return false;
    }
}
