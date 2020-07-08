const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); //adds req.body capabilities
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

app.get("/login", (req, res) => {
  const templateVars = { user: '' }

  res.render("urls_login", templateVars)
})

app.get("/register", (req, res) => {
  const templateVars = { user: '' }
  
  res.render("urls_register", templateVars)
})

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
  return;
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: req.cookies.user_id };
  res.render("urls_show", templateVars);
});

app.get('/urls', (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: req.cookies.user_id
  };
  res.render('urls_index', templateVars);
})

//POSTS
app.post("/login", (req, res) => {
  const { email, password } = req.body
  const alreadyUser = getUserByEmail(email, users);
   if (alreadyUser) {
     if (password === alreadyUser.password) {
       res.cookie('user_id', alreadyUser.id)
       res.redirect('/urls');
     } else {
      res.status(403).send('Password is incorrect, please re-enter');
     }
   } else {
     res.status(403).send('Email does not exist, please register');
   }
     
})

app.post('/logout', (req, res) => {
  req.cookies.alreadyUser = null;
  return res.redirect('/login');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body
  const id = generateRandomString();
  const alreadyUser = getUserByEmail(email, users);
  
  if (email === '' || password === '') {
    return res.status(400).send('Both fields are required');
  }
  if (alreadyUser) {
    return res.status(400).send('a user with that email already exists')
  }

  const newUser = {
    id: id,
    email,
    password
  }
  users[id] = newUser;
  //console.log('new User>>', newUser);
  res.cookie('user_id', id)
  return res.redirect('/urls')
})

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL}
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete",  (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return false;
}

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

