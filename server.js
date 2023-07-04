const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv').config();
const ejs = require('ejs');
//const sslRedirect = require('heroku-ssl-redirect').default

const app = express();
const port = process.env.PORT
const uri = process.env.MONGO_URI
const client = new MongoClient(uri);

/*if(process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}*/

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());


app.get('/', async(req, res) => {
  await client.connect(uri);
  const cursor = client.db('sw-quotes').collection('quotes').find().toArray()
  .then(quotes => {
    res.render('index.ejs', { quotes: quotes })
  })
  .catch(error => console.error(error));
});

app.post('/quotes', async (req, res) => {
  try {
    await client.connect();
    await createQuote(client, req.body);
    res.redirect('/');
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
});

async function createQuote(client, newQuote) {
  const result = await client.db("sw-quotes").collection('quotes').insertOne(newQuote);
  console.log(`New quote created with the following id: ${result.insertedId}`);
}

app.put('/quotes', (req, res) => {
  const quotesCollection = client.db('sw-quotes').collection('quotes');
  quotesCollection.findOneAndUpdate(
    {name: 'Yoda'},
    {
      $set:{
        name: req.body.name,
        quote: req.body.quote
      }
    },
    {
      upsert: true
    }
    )
    //.then(result => result.json('Success'))
    .catch(error => console.error(error))
})

app.delete('/quotes', (req,res) => {
  const quotesCollection = client.db('sw-quotes').collection('quotes');
  quotesCollection.deleteOne({ name: req.body.name })
  .then(result => {
    if(result.deletedCount === 0){
      return res.json(`No quote to delete`);
    }
    res.json(`Deleted Darth Vader's quote`);
  })
  .catch(error => console.error(error));
})


app.listen(port, function () {
  console.log('listening on ' + port);
});



