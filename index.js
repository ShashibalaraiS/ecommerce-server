const express = require('express');
let bodyParser = require("body-parser");
const cors = require('cors');
const mysql = require('mysql')
let fs = require('fs')
const app = express();

const PORT = process.env.PORT || 5000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecom'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    res.status(500).json({ error: 'Failed to connect to MySQL' });
    return;
  }
  console.log('Connected to MySQL database');
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors());
app.set('view engine', 'ejs')
// checking connection

app.get("/", (req, res) => {
  res.redirect("productList")
})
app.get("/productList", (req, res) => {
  const productList = JSON.parse(fs.readFileSync("api.json")).productList
  console.log("product", productList)
  res.json(productList);
});

app.get("/productList/:id", (req, res) => {
  let productId = parseInt(req.params.id)
  console.log("server", productId)
  const productList = JSON.parse(fs.readFileSync("api.json")).productList
  const product = productList.find(product => product.id === productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
  console.log("product", productList)
});

app.post('/users', (req, res) => {
  console.log("request in server", req.body.data)
  const { uname, email } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error executing SELECT query:', err);
      return;
    }
    console.log('Query results:', results);
    if (results.length > 0) {
      orderData(results[0].id, req.body.data, res)
    } else {
      const insertUserSql = 'INSERT INTO users (name, email) VALUES (?, ?)';
      connection.query(insertUserSql, [uname, email], (err, userResult) => {
        if (err) {
          console.error('Error inserting user data into MySQL:', err);
          res.status(500).json({ error: 'Failed to insert user data into MySQL' });
          return;
        }

        console.log('User data inserted into MySQL:', userResult, res);
        orderData(userResult.insertId, req.body.data, res)
      });

    }

  });
});

function orderData(userId, data, res) {
  const sql = 'INSERT INTO `order` (user_id, amount, category) VALUES ' +
              data.map(obj => `(${userId},'${obj.price}','${obj.category}')`).join(',');
  connection.query(sql, (error, results, fields) => {
    if (error) {
      console.error('Error executing query:', error.message); 
      return;
    }
    res.status(201).json({ message: 'Data inserted successfully' });

  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
