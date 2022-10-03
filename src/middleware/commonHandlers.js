/*
Middleware functions 
TokenExtrator: to extract token passed by user for tokenRequired endpoints
errorHandler: express error handler for specific errors
*/


const errorHandler = (err, req, res, next) => {
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "token expired" })
    } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "invalid token" })
    } else if (err.name === "TypeError") {
        return res.status(401).json({ error: "invalid token" })
    }

    next(err)
}

const unkownEndpoint = (req, res) => {
    return res.status(400).json({ error: "unknown endpoint" })
}

module.exports = { errorHandler, unkownEndpoint }
