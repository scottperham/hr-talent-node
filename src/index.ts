import * as path from 'path';
import * as dotenv from 'dotenv';
import { ServiceContainer } from "./services/data/serviceContainer";
import express from 'express';
import configureClientApi from './clientApi';
import configureBotApi from './botApi';

const env_file = path.join(__dirname, "..", ".env");
dotenv.config({path: env_file});

const sampleDataPath = path.join(__dirname, "..", "src\\sampleData");
const templatesPath = path.join(__dirname, "..", "src\\templates");
const staticViewsPath = path.join(__dirname, "..", "src\\StaticViews");

const services = new ServiceContainer();
services.loadData(sampleDataPath);
services.loadTemplates(templatesPath);

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

app.use(express.json());
app.use("/StaticViews", express.static(staticViewsPath));

configureBotApi(app, services);
configureClientApi(app, services);

const port = process.env.port || process.env.PORT || 3978;

app.listen(port, () => {
    console.log(`\nListening to ${ port }`);
});