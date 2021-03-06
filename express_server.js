const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let hashPassword = 'somestingthatbcryptsalysup';

const {urlsForUser, generateRandomString, getUserByEmail} = require('./helpers');

app.use(cookieSession({
  name: 'session',
  keys: [
    'reallyreallywroondandlongsuperstring',
    'anotherstringforus'
  ]
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.set('view engine', 'ejs');

// Databse and User base.
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// use purple as password to email: user@example.com
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$iTVeK77ACBNtr8lsrNtS8e1gMSkMDrGk6e4hgQTOLd2qmHzkqYGHq"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// GET routes (Get Login and Get Register are with the Post routes below)
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (url) {
    return res.redirect(url.longURL);
  } else {
    return res.redirect(404, '/urls');
  }
});

app.get("/urls/new", (req, res) => {
  let longURL = req.params.longURL;
  
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id],
    longURL,
    urlDatabase
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL]) {
    if (users[req.session.user_id]) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user: users[req.session.user_id]
      };
      res.render('urls_show', templateVars); //User is authorized to access
    } else if (users[req.session.user_id] !== urlDatabase[req.params.shortURL]) {
      res.redirect(401, '/urls'); //user is not aurhorized to access shortened URL
    } else {
      res.redirect(404, '/urls'); //This URL does not exist
    }
  } else {
    res.redirect(401, '/urls');
  }
});
  

app.get('/urls', (req, res) => {
  const loggedUser = req.session.user_id;
  
  if (loggedUser) {
    const owner = urlsForUser(urlDatabase, loggedUser);
    const templateVars = {
      urls: owner,
      user: users[req.session.user_id]
    };
    res.render('urls_index', templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});


//LOGIN routes (Get and Post)
app.get("/login", (req, res) => {
  const templateVars = { user: '' };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const alreadyUser = getUserByEmail(email, users);
  if (alreadyUser) {
    if (bcrypt.compareSync(password, alreadyUser.password)) {
      req.session.user_id = alreadyUser.id;
      res.redirect('/urls');
    } else {
      res.redirect(401, '/login');
    }
  } else {
    res.redirect(401, '/register');;
  }
   
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  return res.redirect('/login');
});

// Register Routes (Get and Post)
app.get("/register", (req, res) => {
  const templateVars = { user: '' };
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();
  const alreadyUser = getUserByEmail(email, users);
  
  if (email === '' || password === '') {
    return res.status(400).send('Both fields are required');
  }
  
  if (alreadyUser) {
    return res.redirect(401, '/login');
  } else {
    hashPassword = bcrypt.hashSync(password, saltRounds);
    console.log(hashPassword);
  }

  const newUser = {
    id: id,
    email: email,
    password: hashPassword
  };
  users[id] = newUser;
  req.session.user_id = id;
  console.log(req.session.user_id = id);
  return res.redirect('/urls');
});

//Post Routes
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL:req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id', (req, res) => {
  if (urlDatabase[req.params.id] && req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: req.session.user_id};
    
    res.redirect('/urls');
  } else {
    return res.send('No Authorization');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session.user_id;
  const shortUrl = req.params.id;
  if (!userId) {
    return res.send('No Authorization');
  } else if (urlDatabase[req.params.id] && req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[shortUrl];
    return res.redirect('/urls');
  } else {
    return res.send('No Authorization</p></body></html>');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
