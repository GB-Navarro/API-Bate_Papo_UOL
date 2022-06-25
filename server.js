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
  name: Joi.string().min(1).required(),
});

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
  type: Joi.string().required(),
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/participants", async (req, res) => {
  let username = { name: req.body.name };
  let result = await participantValidate(username);
  if(result === 1){
    if(createParcipant(username)){
      res.sendStatus(201);
    }else{
      console.log("Ocorreu algum erro na criação do participante!");
    }
  }else if(result === 0){
    res.sendStatus(422);
  }else if(result === -1){
    res.sendStatus(409);
  }
});

app.get("/participants", async (req, res) => {
  let participants = await getParticipants();
  res.send(participants);
});

app.post("/messages", (req, res) => {
  message.to = req.body.to;
  message.text = req.body.text;
  message.type = req.body.type;
  message.from = req.headers.user;
  message.time = dayjs().format("HH:MM:ss");
});

app.listen(5000);

async function participantValidate(username) {
  let isNameValid = await checkNameExistence(username);
  if(isNameValid){
    let nameFormatIsValid = validateNameFormat(username);
    if(nameFormatIsValid){
      //retornar status de criado
      //retorna 1
      return 1;
    }else{
      //retornar status 422
      //retorna 0
      return 0;
    }
  }else{
    //retornar status de conflito (409)
    //retorna -1
    return -1;
  }
}

async function createParcipant(username) {
  participant.name = username.name;
  participant.lastStatus = Date.now();
  try {
    let response;
    response = await db.collection("participants").insertOne(participant);
    if (response.acknowledged != undefined && response.acknowledged === true) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("Ocorreu um erro: ", error);
    return false;
  }
}
async function checkNameExistence(username){
  let result;
  result = await db.collection("participants").findOne(username);
  if (result === null) {
    return true;
  } else {
    return false;
  }
}

function validateNameFormat(username){
  let result = participantSchema.validate(username).error
  if(result === undefined){
    return true;
  }else{
    return false;
  }
}

async function getParticipants() {
  let result = await db.collection("participants").find().toArray();
  return result;
}
