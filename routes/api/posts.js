console.log("posts.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../../schemas/user")
const { postsPool } = require("../../schemas/postSchema")
const User = require("../../schemas/user")
const Post = require("../../schemas/PostSchema")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", async (req, res, next) => {
  //   postsPool.query(
  //     `SELECT *, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') AS formatted_createdAt FROM posts INNER JOIN user ON posts.user_Id=user.user_id;
  // `,
  //     function async(error, results, fields) {
  //       if (error) {
  //         console.log(error)
  //         res.sendStatus(400)
  //       } else {
  //         const postData = results.map((result) => ({
  //           content: result.content,
  //           postedBy: {
  //             posts_Id: result.posts_Id,
  //             user_Id: result.user_Id,
  //             username: result.username,
  //             content: result.content,
  //             createdAt: result.createdAt,
  //             updatedAt: result.updatedAt,
  //             pinned: result.pinned,
  //             imageURL: result.imageURL,
  //             user_id: result.user_id,
  //             email: result.email,
  //             password: result.password,
  //             profilePic: result.profilePic,
  //             formatted_createdAt: result.formatted_createdAt,
  //             timefromFE: result.timefromFE,
  //           },
  //         }))
  //         postData.sort(function (a, b) {
  //           return new Date(b.postedBy.posts_Id) - new Date(a.postedBy.posts_Id)
  //         })
  //         // console.log(postData.postedBy["formatted_createdAt"])
  //         res.status(200).send(postData)
  //       }
  //     }
  //   )
  let results = await getPosts({})
  res.status(200).send(results)
})

router.get("/:id", async (req, res, next) => {
  // return res.status(200).send("This is awesome")
  let postId = req.params.id
  // console.log(postId) //correct id of the selected post
  let results = await getPosts({})
  let filteredResults = results.filter(
    (result) => result.postedBy.posts_Id == postId
  )[0]
  console.log(filteredResults.content)
  res.status(200).send(filteredResults)
})

router.post("/", (req, res, next) => {
  if (!req.body.content) {
    // res.status(200).send("it worked.")
    console.log("Content param not sent with request")
    return res.sendStatus(400)
  }
  let timestamp = new Date().getTime()
  let timestampString = new Date(timestamp).toLocaleString()
  let postData = {
    content: req.body.content,
    postedBy: req.session.user,
  }
  console.log("req.session:", req.session)
  console.log("postData:", postData)
  postsPool.query(
    `INSERT INTO posts (content, user_Id, username, timefromFE ) VALUES (?, ?, ?, ?)`,
    [
      postData.content,
      postData.postedBy["user_id"],
      postData.postedBy["username"],
      timestampString,
    ],

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

async function getPosts() {
  return new Promise((resolve, reject) => {
    postsPool.query(
      `SELECT *, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') AS formatted_createdAt FROM posts INNER JOIN user ON posts.user_Id=user.user_id;`,
      function (error, results, fields) {
        if (error) {
          console.log(error)
          reject(error)
        } else {
          const postData = results.map((result) => ({
            content: result.content,
            postedBy: {
              posts_Id: result.posts_Id,
              user_Id: result.user_Id,
              username: result.username,
              content: result.content,
              createdAt: result.createdAt,
              updatedAt: result.updatedAt,
              pinned: result.pinned,
              imageURL: result.imageURL,
              user_id: result.user_id,
              email: result.email,
              password: result.password,
              profilePic: result.profilePic,
              formatted_createdAt: result.formatted_createdAt,
              timefromFE: result.timefromFE,
            },
          }))
          postData.sort(function (a, b) {
            return new Date(b.postedBy.posts_Id) - new Date(a.postedBy.posts_Id)
          })

          resolve(postData)
        }
      }
    )
  })
}

module.exports = router
