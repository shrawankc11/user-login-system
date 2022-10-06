const redisClient = require('../utils/redisClient');
const bcrypt = require('bcrypt');
const getToken = require('../utils/tokenGen');
const client = require('../utils/redisClient');

/**
 * middleware to lookup for user in redis before giving off the control to main controller
 * pass controll if not found with username
 * thorw error if not found with both username and password
 */
const userCacheLookup = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const userFromRedis = await redisClient.get(username);

        if (!userFromRedis) {
            //passing control to next controller if nor user found in redis
            next();
            return;
        }

        //parsing the JSON user object form redis
        const user = JSON.parse(userFromRedis);

        const passwordFromRedis = user
            ? await bcrypt.compare(password, user.passwordHash)
            : null;

        if (!passwordFromRedis) {
            return res.status(401).json({ error: 'invalid password!' });
        }

        //generate refresh and access tokens
        const { refreshToken, accessToken } = getToken({ username: user.username, id: user.id }, 2)
        //appending the new refreshtoken to the user object we got from redis
        user.refreshToken = refreshToken;
        //saving the new user object after appending the refresh token
        await client.set(username, JSON.stringify(user), { EX: 180 })

        return res.status(200).json({
            success: true,
            fromCache: true,
            refreshToken,
            accessToken
        });
        //this catch handler will send the control to the error handler
    } catch (err) {
        next(err);
    }
};

module.exports = userCacheLookup;
