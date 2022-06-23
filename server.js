import express from "express";
import cors from "cors";
import { allowedNodeEnvironmentFlags } from "process";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
})

app.listen(5000);
