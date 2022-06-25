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

let participant = { name: "", lastStatus: 0 };
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

app.post("/participants", async (req, res) => {
    let username = {name: req.body.name}
    let isNameValid = await usernameValidate(username);
    if(isNameValid){
      let response = createParcipant(username);
      if(response){
        res.sendStatus(201);
      }else{
        console.log("Ocorreu algum erro ao criar o novo participante");
      }
    }else{
      console.log("O nome digitado já está em uso")
      res.sendStatus(409);
    }
})
app.listen(5000);

async function usernameValidate(username){
    //OK
    let result;
    result = await db.collection("participants").findOne(username)
    if(result === null){
        return true;
    }else{
        return false;
    }
}

async function createParcipant(username){
  participant.name = username.name;
  participant.lastStatus = Date.now();
  try{
    let response;
    response = await db.collection("participants").insertOne(participant);
    if((response.acknowledged != undefined) && (response.acknowledged === true)){
      return true;
    }else{
      return false;
    }
  } catch(error){
    console.log("Ocorreu um erro: ", error);
    return false;
  }
}