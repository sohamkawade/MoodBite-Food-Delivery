const mongoose = require('mongoose')
const config = require('config')
const debug = require('debug')("development:mongoose")

mongoose.connect(`${config.get("MONGODB_URI")}/moodbite`)
    .then(() => {
        debug("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err.message);
    });

module.exports = mongoose.connection;
