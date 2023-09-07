import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dotenv from "dotenv";
import dayjs from 'dayjs';


const app = express();
app.use(cors());
app.use(express.json());
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

// API functions
app.post("/poll", async (req, res) => {
    const { title, expireAt } = req.body;

    let data = "";
    if (expireAt && expireAt != "") data = expireAt;
    else data = dayjs(Date.now()).add(30, 'day').format('YYYY-MM-DD HH:mm')

    const survey  = {
        title: title,
        expireAt: data
    }

    const validateSchema = schema.validate(survey, { abortEarly: false })
    if (validateSchema.error) return res.status(422).send(data);

	

        try {
            await db.collection('surveys').insertOne(survey);
            return res.sendStatus(201);
         } 
         catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
      
});


app.get("/poll", async (req, res) => {
    try {
        const surveys = await db.collection('surveys').find().toArray();
        return res.send(surveys);
      } catch (error) {
        console.error(error);
        return res.sendStatus(500);
      }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));