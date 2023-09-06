import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dotenv from "dotenv";


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

// JOI Schemas 
const schema = joi.object({
    title: joi.string().required(),
    expireAt: joi.string().required()
})

// DB Connection 
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
	await mongoClient.connect();
	console.log('MongoDB Connected!');
} catch (err) {
  console.log(err.message);
}

const db = mongoClient.db();

// BackEnd API functions
app.post("/poll", async (req, res) => {
    const {title, expireAt} = req.body;

    const validateSchema = schema.validate(req.body, { abortEarly: false })
    if (validateSchema.error) return res.sendStatus(422);

	const survey = {
        title: title,
        expireAt: expireAt
    }

   try {
       await db.collection('surveys').insertOne(survey);
       return res.sendStatus(201);
    } 
    catch (err) {
       console.log(err);
       res.sendStatus(500);
   }

});


app.get("/poll", (req, res) => {
	db.collection("surveys").find().toArray()
		.then(surveys => res.send(surveys))  // array de usuários
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

app.get("/usuarios/:id", (req, res) => {
    const { id } = req.params;
  
    db.collection("users").findOne({ _id: new ObjectId(id) })
          .then((data) => {
              return res.send(data);
          })
          .catch(() => {
              return res.status(500).send(err)
          })
  })


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));