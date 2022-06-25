import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi";

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
const participantSchema = Joi.object({
  name: Joi.string().min(1).required()
})

let message = {
  from: "",
  to: "",
  text: "",
  type: "",
  time: "",
};
const messageSchema = Joi.object({
  to: Joi.string().min(1).required(),
  text: Joi.string().min(1).required(),
  type: Joi.string().required()
})

app.get("/teste", (req, res) => {
  console.log(messageSchema.validate({to:"2",text:"s",type:"a"}).error === undefined) //Se for undefined é válido
})


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

app.get("/participants", async (req, res) => {
  let participants = await getParticipants();
  res.send(participants)
})

app.post("/messages", (req, res) => {
  message.to = req.body.to;
  message.text = req.body.text;
  message.type = req.body.type;
  message.from = req.headers.user;
  console.log("req headers", req.headers);
  console.log("user", req.headers.user);
  message.time = dayjs().format('HH:MM:ss');
  console.log("message", message);
})

app.listen(5000);

async function usernameValidate(username){
    let result;
    result = await db.collection("participants").findOne(username)
    if(result === null){
      if(participantSchema.validate(username).error === undefined){
        return true;
      }
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

async function getParticipants(){
  let result = await db.collection("participants").find().toArray()
  return result;
}