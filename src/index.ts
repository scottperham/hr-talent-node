import * as path from 'path';
import * as dotenv from 'dotenv';
import { ServiceContainer } from "./services/data/serviceContainer";
import express from 'express';
import configureClientApi from './clientApi';
import configureBotApi, { configureAdapter } from './botApi';
import configureNotificationApi from './utilityApi';

const env_file = path.join(__dirname, "..", ".env");
dotenv.config({path: env_file});

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

app.use(express.json());

const staticViewsPath = path.join(__dirname, "..", "src\\StaticViews");
app.use("/StaticViews", express.static(staticViewsPath));

const adapter = configureAdapter();

const services = new ServiceContainer(adapter);

const sampleDataPath = path.join(__dirname, "..", "src\\sampleData");
services.loadData(sampleDataPath);

const templatesPath = path.join(__dirname, "..", "src\\templates");
services.loadTemplates(templatesPath);

configureBotApi(app, services, adapter);
configureClientApi(app, services);
configureNotificationApi(app, services, adapter);

const port = process.env.port || process.env.PORT || 3978;

app.listen(port, () => {
    console.log(`\nListening to ${ port }`);
});