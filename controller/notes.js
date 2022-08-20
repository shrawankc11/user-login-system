const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')
require('dotenv').config()


notesRouter.get('/', async (req, res) => {
    const notes = await Note.find({}).populate('user', { username: 1 })
    return res.json(notes)
})

//route to handle POST request for new notes 
notesRouter.post('/', middleware.tokenExtractor, async (req, res, next) => {
    const body = req.body
    try {
        const decodedToken = jwt.verify(req.token, process.env.SECRET_KEY)

        const user = await User.findById(decodedToken.id)

        const noteObj = {
            note: body.note,
            user: user._id
        }

        const note = await new Note(noteObj).save()
        user.notes = user.notes.concat(note._id)
        await user.save()
        return res.status(201).json(note)
    } catch (err) {
        next(err)
    }
})

module.exports = notesRouter