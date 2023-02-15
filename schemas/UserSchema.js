require("dotenv").config()
const mongoose = require("mongoose")

const Schema = mongoose.Schema

const UserSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    profilePic: {
      type: String,
      default:
        "https://msg-board-s3-bucket.s3.ap-northeast-1.amazonaws.com/msgboard/profilePic.jpeg",
    },
  },
  { timestamps: true }
)

let User = mongoose.model("User", UserSchema)
module.exports = User
