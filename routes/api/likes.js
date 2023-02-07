console.log("likes.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../../schemas/user")
const { postsPool } = require("../../schemas/postSchema")
const { likesPool } = require("../../schemas/likeSchema")
const User = require("../../schemas/user")
const Post = require("../../schemas/PostSchema")
const like = require("../../schemas/likeSchema")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

console.log("0")
// router.get("/api/likes", (req, res, next) => {
//   console.log("0.5")
//   likesPool.query(
//     `SELECT *, DATE_FORMAT(like_timestampfromFE, '%Y-%m-%d %H:%i') AS formatted_likedAt FROM likes;
// `,
//     function async(error, results, fields) {
//       if (error) {
//         console.log(error)
//         res.sendStatus(400)
//       } else {
//         const likesData = results.map((result) => ({
//           likesData: result,
//         }))

//         // console.log(postData.postedBy["formatted_createdAt"])
//         res.status(200).send(likesData)
//       }
//     }
//   )
// })

// router.post("/api/likes", (req, res, next) => {
//   console.log("1")
// if (!req.body.content) {
//   console.log("2")
//
//   return res.status(400).send({
//     error: "no content",
//   })
// }
// console.log("3")

// let postId = req.body.postId
// console.log("postId")
// let userId = req.session.user
// let timestamp = new Date().getTime()
// let timestampString = new Date(timestamp).toLocaleString()

// likesPool.query(
//   `INSERT INTO likes (post_id, like_timestampfromFE ) VALUES ( ?, ?)`,
//   [postId, timestampString],

//   function (error, results, fields) {
//     console.log("4")

//     if (error) {
//       console.log(error)
//       res.sendStatus(400)
//     } else {
//       return res.status(201).send({ success: "Like added successfully" })
//     }
//   }
// )

//   res.status(200).send("it worked")
// })

router.post("/api/likes", (req, res, next) => {
  res.status(200).send("like.js worked")
})

module.exports = router
