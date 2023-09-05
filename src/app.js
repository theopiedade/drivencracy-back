import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
 .then(() => db = mongoClient.db())
 .catch((err) => console.log(err.message));


app.post("/poll", (req, res) => {
	// inserindo usuário
    const { title, expireAt } = req.params;

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