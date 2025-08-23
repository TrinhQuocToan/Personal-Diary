const mongoose = require("mongoose");

const UserTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    re_token: { type: String, required: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("UserToken", UserTokenSchema);
