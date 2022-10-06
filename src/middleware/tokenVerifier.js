const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../configs/config');

const tokenVerifier = (req, res, next) => {
    try {
        let token = req.get('authorization');
        if (token && token.slice(0, 8).toLowerCase().startsWith('bearer')) {
            token = token.substring(7);
            const user = jwt.verify(token, SECRET_KEY);
            req.user = user;
            next();
        } else {
            return res.status(401).json({ error: 'invalid token' });
        }
    } catch (err) {
        next(err);
    }

};

module.exports = tokenVerifier;
