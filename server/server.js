import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);
// Get the directory name
const __dirname = path.dirname(__filename);

import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import cors from "cors";
import session from 'express-session';

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const database = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "jiljil124",
  port: 5432
});

database.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));


app.get('/', (req, res) => {
  res.render('home.ejs');
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request received:', username);

  try {
    const result = await database.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      req.session.username = username; 
      res.redirect('/cats');
    } else {
      res.render('login', { errorMessage: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.render('login', { errorMessage: 'An error occurred: ' + err.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  console.log('Create account request received:', username);

  if (password !== confirmPassword) {
    return res.render('register', { errorMessage: 'Passwords do not match' });
  }

  try {
    const userCheck = await database.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.render('register', { errorMessage: 'Username already exists' });
    }

    await database.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    req.session.username = username;
    res.redirect('/cats');
  } catch (err) {
    console.error('Error during account creation:', err);
    res.render('register', { errorMessage: 'An error occurred: ' + err.message });
  }
});

app.get('/cats', (req, res) => {
  const username = req.session.username;
  res.render('cats', { username, catImageUrl: null, loading: false, favoriteMessage: null });
});

app.post('/cats', async (req, res) => {
  const { imageUrl, username } = req.body;
  console.log('Favorite request received:', imageUrl);

  try {
    await database.query('UPDATE users SET FavoriteImage = $1 WHERE username = $2', [imageUrl, username]);
    res.send('Image favorited successfully');
  } catch (err) {
    console.error('Error during favoriting image:', err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');