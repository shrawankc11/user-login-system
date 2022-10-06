const userRouter = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const userCacheLookup = require('../middleware/userCacheLookup');
const getToken = require('../utils/tokenGen');
const client = require('../utils/redisClient');
const tokenVerifier = require('../middleware/tokenVerifier');
const refreshTokenVerifier = require('../middleware/refreshTokenVerifier');
userRouter.get('/', async (req, res) => {
    const users = await User.find({}).populate('notes', { note: 1 });
    return res.json(users);
});

userRouter.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    return res.json(user);
});

//this route will remove the refresh token that was received from a specific user
//user is unable to make requests to specific endpoint after this action
userRouter.post('/logout', async (req, res, next) => {
    try {
        const user = await User.findById(req.body.id);
        if (user) {
            user.refreshToken = undefined;
            await user.save()
        };
        // refreshTokens = refreshTokens.filter(token => token !== req.body.token)
        return res.status(201).json({ message: 'succesfully logged out' });
    } catch (err) {
        next(err);
    }

});

/**
 * @param {Func} tokenVerifier
 * @param {Func} refreshTokenVerifier
 * @return {Response} 
 */
userRouter.post('/token', tokenVerifier, async (req, res, next) => {
    let user;
    req.token = req.body.token;
    try {
        const userFromToken = req.user;
        const userFromRedis = await client.get(userFromToken.username);
        if (!userFromRedis) {
            user = await User.findById(userFromToken.id);
            [req.user, req.fromCache] = [user, false];
            next();
        } else {
            user = JSON.parse(userFromRedis);
            [req.user, req.fromCache] = [user, true];
            next();
        }
    } catch (err) {
        next(err);
    }
}, refreshTokenVerifier);

//handles all request to the /login route
/**
 * @param {Func} userCacheLookup
 * @return {Response}
 */
userRouter.post('/login', userCacheLookup, async (req, res) => {
    const { password, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ error: 'username did not matched!' });
    }
    const passwordFound = user
        ? bcrypt.compare(password, user.passwordHash)
        : null;
    if (!passwordFound) {
        return res.status(401).json({ error: 'password did not match' });
    }

    const { refreshToken, accessToken } = getToken({ username: user.username, id: user._id }, 2);
    user.refreshToken = refreshToken;
    const savedUser = await user.save();
    await client.set(username, JSON.stringify(savedUser), { EX: 180 });
    return res.status(200).json({
        success: true,
        fromCache: false,
        refreshToken,
        accessToken
    });
});

//this route is used for registering the user
//first we hash the user password and save the hashed password to the database using bcrypt
userRouter.post('/register', async (req, res, next) => {
    const { password, username } = req.body;
    try {
        if (!password || !username) {
            return res
                .status(401)
                .send({ error: 'invalid username or password' });
        }

        const user = await User.findOne({ username });

        if (user) {
            return res.status(401).send({ error: 'user already created' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const userObject = {
            username,
            passwordHash,
        };
        //create and save user if no prior user with same credentials is found
        const savedUser = await new User(userObject).save();
        //also save to the redis Client
        await client.set(username, JSON.stringify(savedUser), { EX: 180 });
        return res
            .status(201)
            .json({ message: 'user creation success!', savedUser });
    } catch (err) {
        next(err);
    }
});

module.exports = userRouter;
