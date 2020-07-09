const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); //adds req.body capabilities
const morgan = require('morgan');
var cookieSession = require('cookie-session')
const {urlsForUser, generateRandomString, getUserByEmail} = require('./helper'); //add email helper

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

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: '' };

  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: '' };
  
  res.render("urls_register", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (url) {
    return res.redirect(url.longURL);
  } else {
    return res.send('add 400 You are not logged in or do not have authorization to this URL');
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
  
  if (urlDatabase[req.params.shortURL] && users[req.session.user_id]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id] };
    console.log("templateVars", templateVars);
    return res.render('urls_show', templateVars);
  } else if (users[req.session.user_id] && users[req.session.user_id] !== urlDatabase[req.params.shortURL]) {
    return res.send('You are logged in but do not have authorization to this URL');
  } else {
    return res.send('You are not logged in and do not have authorization to this URL');
  }
  //res.redirect('/login');
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

//POSTS
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const alreadyUser = getUserByEmail(email, users);
  if (alreadyUser) {
    if (password === alreadyUser.password) {
      req.session.user_id = alreadyUser.id;
      res.redirect('/urls');
    } else {
      res.status(403).send('Password is incorrect, please re-enter');
    }
  } else {
    res.status(403).send('Email does not exist, please register');
  }
     
});

app.post('/logout', (req, res) => {
  req.session.alreadyUser = null;
  return res.redirect('/login');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();
  const alreadyUser = getUserByEmail(email, users);
  
  if (email === '' || password === '') {
    return res.status(400).send('Both fields are required');
  }
  if (alreadyUser) {
    return res.status(400).send('a user with that email already exists');
  }

  const newUser = {
    id: id,
    email,
    password
  };
  users[id] = newUser;
  //console.log('new User>>', newUser);
  req.session.user_id = id;
  return res.redirect('/urls');
});

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
  } else if (urlDatabase[shortUrl].userID === userId) {
    delete urlDatabase[shortUrl];
    return res.redirect('/urls');
  } else {
    return res.send('No Authorization');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
