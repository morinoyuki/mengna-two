const mongoose = require('mongoose')
const schema = new mongoose.Schema({
    group: { type: Number, index: true, required: true, unique: true }
})
exports.QuitGroup = mongoose.model('quitGroup', schema)
