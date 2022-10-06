const cors = require('cors');
const mongoose = require('mongoose');
const userRouter = require('./controller/users');
const notesRouter = require('./controller/notes');
const middleware = require('./middleware/commonHandlers');
const { MONGODB_URI } = require('./configs/config');
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

const uri = MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log('connected to mongodb!'))
    .catch(err => console.log('error connecting to mongodb!', err.message));

app.use('/api/users', userRouter);
app.use('/api/notes', notesRouter);

app.use(middleware.unkownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;