const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');  
const app = express();
const port = 3000;

const url = 'mongodb+srv://Student:ABCdef%401234@cluster0.xxxqx5s.mongodb.net/';
const dbName = 'bank';
let db;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(error => console.error(error));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/customers', async (req, res) => {
  const customers = await db.collection('customers').find().toArray();
  res.render('customers', { customers });
});

app.get('/customer/:id', async (req, res) => {
  const customer = await db.collection('customers').findOne({ _id: new ObjectId(req.params.id) });
  res.render('customer', { customer });
});

app.get('/transfer/:id', async (req, res) => {
  const customer = await db.collection('customers').findOne({ _id: new ObjectId(req.params.id) });
  const customers = await db.collection('customers').find({ _id: { $ne: new ObjectId(req.params.id) } }).toArray();
  res.render('transfer', { customer, customers });
});

app.post('/transfer', async (req, res) => {
    const { from, to, amount } = req.body;
    const fromCustomer = await db.collection('customers').findOne({ _id: new ObjectId(from) });
    const toCustomer = await db.collection('customers').findOne({ _id: new ObjectId(to) });
  
    if (fromCustomer.current_balance >= amount) {
      await db.collection('customers').updateOne({ _id: new ObjectId(from) }, { $inc: { current_balance: -amount } });
      await db.collection('customers').updateOne({ _id: new ObjectId(to) }, { $inc: { current_balance: +amount } });
      await db.collection('transfers').insertOne({
        from: fromCustomer.name,
        to: toCustomer.name,
        amount: parseFloat(amount),
        date: new Date()
      });
      res.redirect('/customers');
    } else {
      const customers = await db.collection('customers').find({ _id: { $ne: new ObjectId(from) } }).toArray();
      res.render('transfer', {
        customer: fromCustomer,
        customers,
        error: 'Insufficient Balance'
      });
    }
  });
  

app.get('/transfers', async (req, res) => {
    const transfers = await db.collection('transfers').find().toArray();
    res.render('transfers', { transfers });
  });
  