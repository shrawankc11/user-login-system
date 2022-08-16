
const tokenExtracotr = (req, res, next) => {
    const token = req.get("authorization")
    if (token && token.slice(0, 8).toLowerCase().startsWith('bearer')) {
        const accessToken = token.substring(7)
        req.token = accessToken
        next()
    } else {
        return res.status(401).json({ error: "invalid token" })
    }
    //const accessToken = token && token.split(" ")[1]
}

const errorHandler = (err, req, res, next) => {
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "token expired" })
    } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "invalid token" })
    }

    next(err)
}

module.exports = { tokenExtracotr, errorHandler }
