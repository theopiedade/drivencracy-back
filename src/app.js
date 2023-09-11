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
            return res.status(201).send(survey);
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

app.post("/choice", async (req, res) => {
  const { title, pollId } = req.body;

  const checkPoll = await db.collection('surveys').findOne({ _id: new ObjectId(pollId) });
  if (!checkPoll) return res.status(404).send("ID da enquete não encontrado: "+pollId);

  if (!title || title == null || title == "") return res.status(422).send("Resposta não pode ser vazia");

  const checkTitle = await db.collection('surveys').findOne({title})
  if (checkTitle) return res.status(409).send("Resposta não pode ser repetida");

  const expireAt = await db.collection('surveys').findOne({pollId}, {expireAt: 1});
  const result= expireSchema.validate(expireAt);
  if (!result.error) return res.status(403).send("Enquete já expirada");

 
  const choice  = {
      title: title,
      pollId: new ObjectId(pollId)
  }

      try {
          await db.collection('choices').insertOne(choice);
          return res.status(201).send(choice);
       } 
       catch (err) {
          console.log(err);
          res.sendStatus(500);
      }
    
});

app.get("/poll/:id/choice", async (req, res) => {
  const { id } = req.params;
  try {
      const choices = await db.collection('choices').find({ pollId: new ObjectId(id) }).toArray()
      return res.send(choices);
    } catch (error) {
      console.error(error);
      return res.status(404).send("Não existe enquete com esse id: "+id);
    }
});


app.post("/choice/:id/vote", async (req, res) => {
  const { id } = req.params;

  const checkChoices = await db.collection('choices').findOne({ _id: new ObjectId(id) });
  if (!checkChoices) return res.status(404).send("Resposta não encontrada: "+id);

  const pollId = await db.collection('choices').findOne({id}, {pollId: 1});

  const expireAt = await db.collection('surveys').findOne({pollId}, {expireAt: 1});
  const result= schema.validate(expireAt);
  if (!result.error) return res.status(403).send("Enquete já expirada");

  const vote = {
    createdAt: dayjs(Date.now()).format('YYYY-MM-DD HH:mm'),
    choiceId: new ObjectId(id)
  }


  try {
      await db.collection('votes').insertOne(vote);
      return res.status(201).send(vote);
  } 
  catch (err) {
      console.log(err);
      res.sendStatus(500);
  }
});


app.get("/poll/:id/result", async (req, res) => {
  const { id } = req.params;

  const survey = await db.collection('surveys').findOne({ _id: new ObjectId(id) });
  if (!survey) return res.status(404).send("Enquete não existe: "+id);

  const choices = await db.collection('choices').find({ pollId: new ObjectId(id) }).toArray()


  let majorVotes = 0;
  let majorIdVotes = ""; 
  choices.map( choices => 
      {
        let votes = db.collection('votes').find({ choiceId: new ObjectId(choices.choiceId) }).toArray()
        let countvotes = votes.length;
        if (countvotes > majorVotes) { 
          majorVotes = countvotes;
          majorIdVotes = choices.choicesId;
        }
      }
    );

 const title = await db.collection('surveys').findOne({id}, {title: 1});

  const result = {
    _id: id,
    title: survey.title,
    expireAt: survey.expireAt,
    result: {
      title: title,
      votes: majorVotes
    }
  }

  return res.send(result);

});



// Tests functions created
app.get("/choices", async (req, res) => {
  try {
      const choices = await db.collection('choices').find().toArray();
      return res.send(choices);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
});

app.get("/votes", async (req, res) => {
  try {
      const votes = await db.collection('votes').find().toArray();
      return res.send(votes);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));