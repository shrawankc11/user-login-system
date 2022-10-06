const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../configs/config');

/**
 * verify and unpack the obj with token sent from user
 * if error we sent an error response
 * else we send the control to next main controller
 */
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
