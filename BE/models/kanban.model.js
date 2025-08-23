const mongoose = require("mongoose")
const User = require("./user.model")

const columnSchema = new mongoose.Schema({
    title: String,
    tasks: [String]
})

const kanbanSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
   },
   boardName: String,
   columns: [columnSchema],
}, {timestamps: false, versionKey: false})

const Kanban = mongoose.model('Kanban', kanbanSchema)
module.exports = Kanban