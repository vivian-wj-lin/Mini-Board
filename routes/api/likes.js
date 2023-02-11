console.log("likes.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
// const { userPool } = require("../../schemas/user")
// const { postsPool } = require("../../schemas/postSchema")
// const { likesPool } = require("../../schemas/likeSchema")
// const User = require("../../schemas/user")
// const Post = require("../../schemas/PostSchema")
// const like = require("../../schemas/likeSchema")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

module.exports = router
