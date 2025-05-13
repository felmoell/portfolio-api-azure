const bodyParser = require('body-parser');
var express = require('express');
var cors = require('cors');
var mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
var app = express();
const projectController = require('./controllers/projectsController');
var port = process.env.PORT || 8080;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
require("dotenv").config();
const apiKeys = require('./config/apiKeys');
const createAuthRateLimiter = require('./middleware/apiKeyAuthAndRateLimit');
const rateLimiterMap = new Map();
async function main() {
    try {
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(process.env.KEYVAULT_URI, credential);
        const secretPW = await client.getSecret('mongoDBPassword');
        const secretUser = await client.getSecret('mongoDBUser');
        const secretURL = await client.getSecret('mongoDBUrl');


          mongoose.connect(`mongodb+srv://${secretUser.value}:${secretPW.value}@${secretURL.value}/githubprojects?retryWrites=true&w=majority&appName=Cluster0`, { useNewUrlParser: true });
        var conn = mongoose.connection;
        conn.on('connected', function () {
            console.log('database is connected successfully');
        });
        conn.on('disconnected', function () {
            console.log('database is disconnected successfully');
        })
        conn.on('error', console.error.bind(console, 'connection error:'));

        app.listen(port, function () {
            console.log('Node.js listening on port ' + port);
        });

        const authRateLimiter = createAuthRateLimiter(rateLimiterMap);
        app.use('/api/repos',  projectController(authRateLimiter));

        const limiterOptions = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10,
            standardHeaders: true,
            legacyHeaders: false,
            message: { message: 'Too many requests, please try again later.' }
        };

        for (const apiKey of Object.keys(apiKeys)) {
            rateLimiterMap.set(apiKey, rateLimit(limiterOptions));
        }

    } catch (error) {
        console.log(error);
    }
}

main();