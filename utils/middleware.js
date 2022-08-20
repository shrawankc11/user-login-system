/*
Middleware functions 
TokenExtrator: to extract token passed by user for tokenRequired endpoints
errorHandler: express error handler for specific errors
*/ 
const tokenExtractor = (req, res, next) => {
    const token = req.get("authorization")
    if (token && token.slice(0, 8).toLowerCase().startsWith('bearer')) {
        const accessToken = token.substring(7)
        req.token = accessToken
        next()
    } else {
        return res.status(401).json({ error: "invalid token" })
    }
}

const errorHandler = (err, req, res, next) => {
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "token expired" })
    } else if (err.name === "JsonWebTokenError") {
        res.status(401).write({ error: "invalid token" })
    }

    next(err)
}

const unkownEndpoint = (req, res) => {
    return res.status(400).json({ error: "unknown endpoint" })
}

module.exports = { tokenExtractor, errorHandler,unkownEndpoint }
