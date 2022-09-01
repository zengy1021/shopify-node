import express from 'express';
import bodyParser from 'body-parser';
import { addUser } from './data/users';

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).send('Bad username or password');
  }
  addUser({ username, password });
  res.status(201).send('User created');
});

app.listen(PORT, () => {
  console.log(`Express with Typescript! http://localhost:${PORT}`);
});