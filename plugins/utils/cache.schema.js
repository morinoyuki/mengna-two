const mongoose = require('mongoose')
const schema = new mongoose.Schema({
    imageMd5: { type: String, index: true, required: true, unique: true },
    date: { type: Date, default: Date.now },
    type: { type: String, index: true, required: true },
    similarity: Number,
    msg: Array || String
})

exports.ImageCache = mongoose.model('imageCache', schema)