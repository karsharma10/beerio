const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
const fetch = require("node-fetch");
const path = require('path');
const e = require('express');
const { query } = require('express');

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };
  
const db = pgp(dbConfig);

  // test your database
  db.connect()
    .then(obj => {
      console.log('Database connection successful'); // you can view this message in the docker compose logs
      obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('ERROR:', error.message || error);
    });

  // Authentication Middleware.
  const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to register page.
      console.log('hi');
      res.redirect('/register');
    }
    next();
  };
  
  // Authentication Required
  //app.use(auth);

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'resources')));



  
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
app.get('/', (req, res) =>{
    res.redirect('/main');
});

app.get('/review', (req, res) =>{
  var query = "SELECT * FROM REVIEWS;";
  db.any(query)
    .then((data) => {
      res.render("pages/review", {
        data
      });
    })
    .catch((err) => {
      res.render("pages/review", {
        data: [],
        error: true,
        message: err,
      });
    });


});

app.get('/main', (req, res) =>{
    res.render('pages/main'); //this will call the /anotherRoute route in the API
});
app.get('/searchByState', (req, res) =>{
    res.render('pages/searchByState'); //this will call the /anotherRoute route in the API
});
app.get('/brewSearch', (req, res) =>{
    res.render('pages/brewSearch'); //this will call the /anotherRoute route in the API
});
app.post('/breweries', async (req, res) =>{
    //console.log(req.body.citySearch);
    //console.log(`http://api.openbrewerydb.org/breweries?by_city=${req.body.citySearch}`);
    if(req.body.citySearch === ""){
      res.render('pages/main', {
        error: true,
        message: "Please Type In A City",
      });
    }
    else{
      axios({
        url: `http://api.openbrewerydb.org/breweries?`,
            method: 'GET',
            dataType:'json',
            headers: { Accept: "application/json", "Accept-Encoding": "identity" },
            params: {
                "by_city":req.body.citySearch
            }
        })
        .then(results => {
          if (results.data.length === 0) {
            res.render('pages/main', {
              error: true,
              message: "That City Doesn't Exist In The Database, Please Check Your Spelling Or Try Another City.",
            });
          }
          else{
            //console.log('results', results.data); // the results will be displayed on the terminal if the docker containers are running
            res.render("pages/main", {results:results.data});
          }
            // Send some parameters

        })
        .catch(error => {
        // Handle errors
          res.render('pages/main', {
              error: true,
              message: error,
          });
          //console.log(error);
            
        });

    }
});

app.post('/addReview', async (req, res) =>{

  //console.log(req.body.nameBrew);
  //console.log(req.body.addReview);

  if(req.body.addReview == ""){
    res.render('pages/main', {
      error: true,
      message: "You Must Type In A Review",
  });
  }
  else{
    var query = `INSERT INTO Reviews (brewery, review,review_date) VALUES ('${req.body.nameBrew}', '${req.body.addReview}', 'NOW()');`;

    db.any(query)
      .then(function () {
        res.redirect('/review');
      });
    }
});
app.get('/*', (req, res) => {
  res.redirect('/main')
});

app.listen(3000);
console.log('Server is listening on port 3000');