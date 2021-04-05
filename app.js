const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const { notEqual } = require('assert');

const requireToken = async (req, res, next) => {
  try {
    req.user = await User.byToken(req.headers.authorization);
    next();
  } catch(error) {
    next(error);
  }
}

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', requireToken, async (req,res, next) => {
  try {
    const { id } = req.user;
    if (id === Number(req.params.id)) {
      const notes = await Note.findAll({
        where: {
          userId: id
        }
      });
      res.send(notes);
    } else {
      res.status(401).send("Access denied");
    }

  }
  catch(ex){
    next(ex);
  }
})

app.get('/api/auth', requireToken, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message });
  });

  module.exports = app;
