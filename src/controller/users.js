const userRouter = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cacheLookUp = require('../middleware/chacheLookup');
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
    const passwordFound = user
        ? await bcrypt.compare(password, user.passwordHash)
        : false;
    if (!user && !passwordFound) {
        return res
            .status(401)
            .json({ error: 'either username or password is not matching' });
    }

    userForToken = {
        username: user.username,
        id: user._id,
    };

    //since we dont find user information in redis we save it to redis after verifiction in the database
    tokens = getToken(userForToken, 2);
    toRedis = {
        passwordHash: user.passwordHash,
        id: user._id,
        ...tokens,
    };

    client.set(username, JSON.stringify(toRedis));

    if (!userFound) {
        user.refreshToken = tokens.refreshToken;
        await user.save();
    }

    //send tokens to user in response body
    return res.status(201).json({
        ...tokens,
        userId: user._id,
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
        console.log(savedUser);
        const id = savedUser._id;
        const toRedis = {
            passwordHash,
            id,
            username,
        };
        //also save to the redis Client
        client.set(username, JSON.stringify(toRedis));
        console.log('REDIS HIT: saved user data to Redis');
        return res.status(201).json(savedUser);
    } catch (err) {
        next(err);
    }
});

module.exports = userRouter;
