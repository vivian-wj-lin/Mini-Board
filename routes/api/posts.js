console.log("posts.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../../schemas/user")
const { postsPool } = require("../../schemas/postSchema")
const user = require("../../schemas/user")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", (req, res, next) => {})

router.post("/", (req, res, next) => {
  if (!req.body.content) {
    // res.status(200).send("it worked.")
    console.log("Content param not sent with request")
    return res.sendStatus(400)
  }
  let postData = {
    content: req.body.content,
    postedBy: req.session.user,
  }
  console.log("postData:", postData)
  postsPool.query(
    `INSERT INTO posts (content, postedBy) VALUES (?, ?)`,
    [postData.content, postData.postedBy["username"]],
    function (error, results, fields) {
      if (error) {
        console.log(error)
        res.sendStatus(400)
      } else {
        res.status(201).send(postData)
      }
    }
  )

  // res.status(200).send("it worked")
})

module.exports = router
