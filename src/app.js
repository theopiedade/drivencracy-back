import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dotenv from "dotenv";


const app = express();
app.use(express.json());

// JOI Schemas 
const schema = joi.object({
    title: joi.string().required(),
    expireAt: joi.string().required()
})

const expireSchema = joi.date().greater('now');

// DB Connection 
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
	await mongoClient.connect();
	console.log('MongoDB Connected!');
} catch (err) {
  console.log(err.message);
}

const db = mongoClient.db();


app.post("/poll", (req, res) => {
    const { title, expireAt } = req.params;

    const validateSchema = schema.validate(req.body, { abortEarly: false })
    if (validateSchema.error) return res.sendStatus(422);

	db.collection("survey").insertOne({
		title: title,
		expireAt: expireAt
	}).then(users => res.sendStatus(201))
		.catch(err => console.log(err.message))
});


app.get("/usuarios", (req, res) => {
	// buscando usuários
	db.collection("users").find().toArray()
		.then(users => res.send(users))  // array de usuários
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.post("/choice", async (req, res) => {
  const { title, pollId } = req.body;

  const checkPoll = await db.collection('surveys').find({pollId});
  if (!checkPoll) return res.status(404).send("ID da enquete não encontrado: "+pollId);

  if (!title || title == null || title == "") return res.status(422).send("Resposta não pode ser vazia");

  const checkTitle = await db.collection('surveys').findOne({title})
  if (checkTitle) return res.status(409).send("Resposta não pode ser repetida");

  const expireAt = await db.collection('surveys').findOne({pollId}, {expireAt: 1});
  const result= schema.validate(expireAt);
  if (!result.error) return res.status(403).send("Enquete já expirada");

 
  const choice  = {
      title: title,
      pollId: pollId
  }

      try {
          await db.collection('choices').insertOne(choice);
          return res.sendStatus(201);
       } 
       catch (err) {
          console.log(err);
          res.sendStatus(500);
      }
    
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));