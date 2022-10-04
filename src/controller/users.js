const userRouter = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cacheLookUp = require('../middleware/cacheLookUp');
const getToken = require('../utils/tokenGen');
require('dotenv').config();
const client = require('../utils/redisClient');

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
userRouter.post('/logout', async (req, res) => {
    const user = await User.findById(req.body.id);
    user.refreshToken = undefined;
    await user.save();
    // refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    return res.status(201).json({ message: 'succesfully logged out' });
});

//this route handles all our request for new acess tokens
//we use refresh tokens to create new access tokens
userRouter.post('/token', async (req, res, next) => {
    const { token } = req.body;
    let user, newAccessToken;
    if (!token) return res.status(401);
    try {
        const userFromToken = jwt.verify(token, process.env.REFRESH_KEY);
        const userFromRedis = await client.get(userFromToken.username);
        if (!userFromRedis) {
            user = await User.findById(userFromToken.id);
            if (user && user.refreshToken === token) {
                newAccessToken = getToken(
                    { username: user.username, id: user._id },
                    1
                );
                console.log('REDIS HIT: got data from redis');
                return res.json({ newAccesToken: newAccessToken });
            } else {
                return res.status(403).json({ error: 'invalid refresh token' });
            }
        } else {
            user = JSON.parse(userFromRedis);
            if (user.refreshToken === token) {
                newAccessToken = getToken(
                    { username: user.username, id: user.id },
                    1
                );
                console.log('REDIS MISS: got data from mongoDB');
                return res.json({ newAccesToken: newAccessToken });
            } else {
                return res.status(403).json({ error: 'invalid refresh token' });
            }
        }
    } catch (err) {
        next(err);
    }
});

//when user sends request to /login this router will handle the request

userRouter.post('/login', cacheLookUp, async (req, res) => {
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

    return res.status(200).json({
        success: true,
        ...getToken({ username: user.username, id: user._id }, 2),
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
        console.log(JSON.stringify(savedUser));
        //also save to the redis Client
        client.set(username, JSON.stringify(savedUser));
        // console.log('saved user data to redis');
        return res
            .status(201)
            .json({ message: 'user creation success!', savedUser });
    } catch (err) {
        next(err);
    }
});

module.exports = userRouter;
