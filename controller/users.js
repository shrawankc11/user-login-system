const userRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()

//define refresh Token to store all users refresh tokens here
//this will be empty when server restarts since we do not have any state
// let refreshTokens = []

userRouter.get('/', async (req, res) => {
    const users = await User.find({}).populate('notes', { note: 1 })
    return res.json(users)
})

userRouter.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id)
    return res.json(user)
})

//this route will remove the refresh token that was received from a specific user
//user is unable to make requests to specific endpoint after this action
userRouter.post('/logout', async (req, res) => {
    const user = await User.findById(req.body.id)
    user.refreshToken = undefined
    await user.save()
    // refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    return res.status(201).json({ message: "succesfully logged out" })
})

//this route handles all our request for new acess tokens
//we use refresh tokens to create new access tokens
userRouter.post('/token', async (req, res, next) => {
    const token = req.body.token
    if (!token) return res.status(401)
    try {
        const userFromToken = jwt.verify(token, process.env.REFRESH_KEY)
        const user = await User.findById(userFromToken.id)
        if (user && user.refreshToken === token) {
            const newAccessToken = jwt.sign({ username: user.username, id: user._id }, process.env.SECRET_KEY, { expiresIn: "30s" })

            //sending new access tokens to user if the refresh token validates 
            return res.json({ newAccesToken: newAccessToken })
        } else {
            return res.status(403).json({ error: "invalid refresh token" })
        }
    } catch (err) {
        next(err)
    }
})

//when user sends request to /login this router will handle the request

userRouter.post('/login', async (req, res, next) => {
    const { password, username } = req.body

    const user = await User.findOne({ username })
    const passwordFound = user === null ? false : bcrypt.compare(password, user.passwordHash)
    if (!user && !passwordFound) {
        return res.status(401).json({ error: 'either username or password is not matching' })
    }

    const userForToken = {
        username: user.username,
        id: user._id
    }
    //creating refreshtoken and access token using jwt
    const refreshToken = jwt.sign(userForToken, process.env.REFRESH_KEY);
    const token = jwt.sign(userForToken, process.env.SECRET_KEY, { expiresIn: '30s' })
    user.refreshToken = refreshToken
    await user.save()
    //send tokens to user in response body
    return res.status(201).json({ token, refreshToken, username: user.username, userId : user._id })
})

//this route is used for registering the user
//first we hash the user password and save the hashed password to the database using bcrypt
userRouter.post('/register', async (req, res, next) => {
    const { password, username } = req.body
    try {
        if (!password || !username) {
            return res.status(401).send({ error: 'invalid username or password' })
        }

        const user = await User.findOne({ username })

        if (user) {
            return res.status(401).send({ error: 'user already created' })
        }

        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const userObject = {
            username,
            passwordHash
        }

        //create and save user if no prior user with same credentials is found
        const savedUser = await new User(userObject).save()
        return res.status(201).json(savedUser)
    } catch (err) {
        next(err)
    }


})

module.exports = userRouter