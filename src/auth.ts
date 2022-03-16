import { RequestHandler, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const botFrameworkAuth : RequestHandler = (req, res, next) => {
    
    const token = commonAuth(req, res);
    
    if (!token) {
        return;
    }

    if (token.iss !== "https://api.botframework.com") {
        res.status(401).send("This endpoint only accepts tokens from bot service");
        return;
    }

    next();
};

export const aadAppAuth : RequestHandler = (req, res, next) => {
    const token = commonAuth(req, res);
    
    if (!token) {
        return;
    }

    if (!token.tid) {
        res.status(403).send("No tenant id in token");
        return;
    }

    if (token.iss !== `https://login.microsoftonline.com/${token.tid}/v2.0`) {
        res.status(401).send("This endpoint only accepts tokens issued by your app registration");
        return;
    }

    next();
};

const commonAuth : (req: Request, res: Response) => JwtPayload | undefined = (req, res) => {
    const token = getTokenFromHeader(req);
    if (!token) {
        res.status(403);
        return undefined;
    }
    const result = validateToken(token);
    if (!result.valid) {
        res.status(401).send(result.error);
        return undefined;
    }

    if (token.aud !== process.env.MicrosoftAppId) {
        res.status(401).send("This endpoint only accepts tokens where the audience is your AAD app");
        return undefined;
    }

    return token;
};

const validateToken : (token: JwtPayload) => {error?: string, valid: boolean} = (token) => {
    const nowPlusSkew = new Date();
    nowPlusSkew.setMinutes(nowPlusSkew.getMinutes() + 5, nowPlusSkew.getSeconds());
    const nowPlusSkewSinceEpoch = Math.round(nowPlusSkew.getTime() / 1000);

    if (token.iat && nowPlusSkewSinceEpoch < token.iat) {
        return {error: "Token not yet valid", valid: false}
    }

    if (token.exp && nowPlusSkewSinceEpoch > token.exp) {
        return {error: "Token has expired", valid: false}
    }

    return {valid: true};
}

const getTokenFromHeader : (req: Request) => JwtPayload | undefined = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return undefined;
    }

    if (!authHeader.toLowerCase().startsWith("bearer ")) {
        return undefined;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return undefined;
    }

    const decoded = jwt.decode(token);

    if (!decoded) {
        return undefined;
    }

    return decoded as JwtPayload;
}