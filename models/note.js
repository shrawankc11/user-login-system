const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
    note: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

noteSchema.set('toJSON', {
    transform: (doc, obj) => {
        obj.id = obj._id.toString()
        delete obj._id
        delete obj.__v
    }
})

module.exports = mongoose.model("Note", noteSchema)