const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');
const router = require('./routes/router');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use('/', router);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose.connect(process.env.DB_URI)
    .then(()=>{
        console.log("Db connected.");
        app.listen(PORT, ()=>{console.log("Server is running 🍆🍆🍆")});
    })
    .catch((err)=>{
        console.log(err);
    });
