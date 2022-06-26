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

let participantsArray = [];
let participant = { name: "", lastStatus: 0 };
const participantSchema = Joi.object({
  name: Joi.string().min(1).required(),
});

let messagesArray = [];
let message = {
  from: "",
  to: "",
  text: "",
  type: "",
  time: "",
};
const messageSchema = Joi.object({
  //from:Joi.string().valid().required(),
  to: Joi.string().min(1).required(),
  text: Joi.string().min(1).required(),
  type: Joi.string().valid('message','private_message').required(),
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
  participantsArray = await getParticipants();
  res.send(participantsArray);
});

app.post("/messages", async (req, res) => {
  let messageWasCreated = await createMessage(req.body, req.headers);
  if(messageWasCreated){
    res.sendStatus(201);
  }else{
    res.sendStatus(422);
  }
});

app.get("/messages", async (req, res) => {
  let user = req.headers.user;
  let limit = req.query.limit;
  let userMessages = await getUserMessages(user);
  if(limit != undefined){
    if(parseInt(limit) > userMessages.length){
      res.send(userMessages);
    }else{
      let limitedMessages = [];
      for(let i = 0; i < limit; i++){
        limitedMessages.push(userMessages[i]);
      }
      console.log("l",limitedMessages)
      res.send(limitedMessages);
    }
  }else{
    res.send(userMessages);
  }
})

app.listen(5000);

async function participantValidate(username) {
  let isNameValid = await checkNameExistence(username);
  if(isNameValid){
    let nameFormatIsValid = validateNameFormat(username);
    if(nameFormatIsValid){
      return 1;
    }else{
      return 0;
    }
  }else{
    return -1;
  }
}

async function createParcipant(username) {
  participant.name = username.name;
  participant.lastStatus = Date.now();
  try {
    let response = await db.collection("participants").insertOne(participant);
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
  let result = await db.collection("participants").findOne(username);
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

async function createMessage(bodyData, headerData){
  message.to = bodyData.to;
  message.text = bodyData.text;
  message.type = bodyData.type;
  message.from = headerData.user;
  message.time = dayjs().format("HH:MM:ss");

  let promisse = await db.collection("messages").insertOne(message);
  if(promisse.acknowledged === true){
    // a mensagem foi armazenada no banco de dados
    return true;
  }else{
    // a mensagem não foi armazenada no banco de dados
    return false;
  }
}

async function getAllMessages(){
  let result = await db.collection("messages").find().toArray();
  return result;
}

async function getUserMessages(user){
  let userMessages = [];
  messagesArray = await(getAllMessages());
  messagesArray.reverse().forEach((element, i) => {
    if(element.to === "Todos" || element.to === user || element.from === user){
      userMessages.push(messagesArray[i])
    }
  })
  return userMessages;
}