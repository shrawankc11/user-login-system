const redisClient = require('../utils/redisClient');
const bcrypt = require('bcrypt');
const tokenGen = require('../utils/tokenGen');

/**
 * middleware to lookup for user in redis before giving off the controller to main controller
 * pass controll if not found with username
 * thorw error if not found with both username and password
 */
const cacheLookUp = async (err, req, res, next) => {
    const { username, password } = req.body;

    try {
        const userFromRedis = await redisClient.get(username);

        if (!userFromRedis) next();

        const user = JSON.parse(userFromRedis);

        const passwordFromRedis = user
            ? await bcrypt.compare(password, user.passwordHash)
            : null;

        if (!userFromRedis && !passwordFromRedis) {
            return res.status(401).json({ error: 'invalid password!' });
        }
        console.log('redis hit got user data from redis');

        const payload = {
            username: user.username,
            id: user.id,
        };

        return res.status(200).json({
            success: true,
            ...tokenGen(payload, 2),
        });
    } catch (err) {
        next(err);
    }
};

module.exports = cacheLookUp;