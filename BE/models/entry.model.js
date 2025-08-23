const mongoose = require("mongoose")
const User = require("./user.model")

const entrySchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
   },
   title: String,
   content: String,
   tag: [String],
   emotion: {
      type: String,
      enum: ["Happy", "Sad", "Angry", "Excited", "Neutral"]
    },    
   createdAt: String,
   isDeleted: Boolean
}, {timestamps: true, versionKey: false})

const Entry = mongoose.model('Entry', entrySchema)
module.exports = Entry