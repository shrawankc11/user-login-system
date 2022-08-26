const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./controller/users");
const notesRouter = require("./controller/notes");
const middleware = require("./utils/middleware");
const http = require("http");

require("dotenv").config();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI;
mongoose
    .connect(uri)
    .then(() => console.log("connected to mongoDB!"))
    .catch((err) => console.log("connection failed!"));

//all the request to /api/users will be routed to this app
app.use("/api/users", userRouter);
//all the request to /api/notes will be routed to this app
app.use("/api/notes", notesRouter);

app.use(middleware.unkownEndpoint);
app.use(middleware.errorHandler);

const server = http.createServer(app);

const PORT = process.env.port || 3001;

server.listen(PORT, () => console.log(`listening to port ${PORT}`));
