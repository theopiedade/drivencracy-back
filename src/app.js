import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// JOI Schemas 

const schema = joi.object({
    name: joi.string().required(),

    email: joi.string().required()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),

    password: joi.string().required().min(3)
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


app.post("/poll", (req, res) => {
    const { title, expireAt } = req.params;

    if (title && title != null &&) return res.sendStatus(422);

	db.collection("users").insertOne({
		email: "joao@email.com",
		password: "minha_super_senha"
	}).then(users => res.sendStatus(201))
		.catch(err => console.log(err.message))
});


app.get("/usuarios", (req, res) => {
	// buscando usuários
	db.collection("users").find().toArray()
		.then(users => res.send(users))  // array de usuários
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