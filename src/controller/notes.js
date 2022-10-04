const notesRouter = require('express').Router();
const Note = require('../models/note');
const User = require('../models/user');
const tokenVerifier = require('../middleware/tokenVerifier');
require('dotenv').config();

notesRouter.get('/', async (req, res) => {
    const notes = await Note.find({}).populate('user', { username: 1 });
    return res.json(notes);
});

//route to handle POST request for new notes
notesRouter.post('/', tokenVerifier, async (req, res, next) => {
    const body = req.body;
    try {
        const userFromToken = req.user;

        const user = await User.findById(userFromToken.id);

        const noteObj = {
            note: body.note,
            user: user._id,
        };

        const note = await new Note(noteObj).save();
        user.notes = user.notes.concat(note._id);
        await user.save();
        return res.status(201).json(note);
    } catch (err) {
        next(err);
    }
});

module.exports = notesRouter;
