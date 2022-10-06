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
            //when user loggs out we clear the refreshtoken property from user
            //thus ending the current session and saving after removing it
            user.refreshToken = undefined;
            await user.save()
        };

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
    //appending the token from body of the request to the request object itself
    //so that we can use it in our *refreshTokenVerifier* handler 
    req.token = req.body.token;
    try {
        //accessing the user object that we passed from *tokenVerifier* handler
        const userFromToken = req.user;
        const userFromRedis = await client.get(userFromToken.username);
        //if user is found in redis then we send that user object to the next controller
        if (userFromRedis) {
            user = JSON.parse(userFromRedis);
            //the fromCache property is to let the client know if the response is from cache or from disk
            [req.user, req.fromCache] = [user, true];
            next();
            //if user is not found in redis then we get the user from mongodb and send that user object
        } else {
            user = await User.findById(userFromToken.id);
            [req.user, req.fromCache] = [user, false];
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

    //checking mongodb for user
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

    //generate both accesstoken and refresh token
    const { refreshToken, accessToken } = getToken({ username: user.username, id: user._id }, 2);
    //append refreshtoken to the user object from mongodb
    user.refreshToken = refreshToken;
    //after appending the refresh token we save the user to mogodb
    //this returns a unique user id and saved refresh token as the users properties
    const savedUser = await user.save();
    //saving the savedUser object we got from mongodb to redis 
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
