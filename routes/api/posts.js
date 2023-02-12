console.log("posts.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../../schemas/user")
const { postsPool } = require("../../schemas/postSchema")
const User = require("../../schemas/user")
// const Post = require("../../schemas/PostSchema")

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
  let postData = await getPosts({})
  let filteredpostData = postData.filter(
    (result) => result.postedBy.posts_Id == postId
  )[0]

  let results = {
    postData: postData,
    filteredpostData: filteredpostData,
  }

  if (filteredpostData.replyTo !== null) {
    results.replyTo = filteredpostData.replyTo
  }

  let replies = await getPosts({})
  results.replies = replies.filter((reply) => reply.replyTo == postId)

  console.log("filteredpostData in posts js:", filteredpostData)
  console.log("results in posts.js:", results)

  res.status(200).send(results)
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
  // console.log("req.body:", req.body)
  if (req.body.replyTo) {
    // console.log("req.body:", req.body)
    // console.log("this is postData.replyTo:", req.body.replyTo) //original post ID
    postData.replyTo = req.body.replyTo
  }

  console.log("req.session in post.js:", req.session)
  console.log("postData in post.js:", postData)
  postsPool.query(
    `INSERT INTO posts (content, user_Id, username, timefromFE,replyTo ) VALUES (?, ?, ?, ?, ?)`,
    [
      postData.content,
      postData.postedBy["user_id"],
      postData.postedBy["username"],
      timestampString,
      postData.replyTo,
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

router.delete("/:id", (req, res, next) => {
  console.log(req.params.id)
  const deletePostQuery = `DELETE FROM posts WHERE posts_Id = ?;`
  const deleteLikeQuery = `DELETE FROM likes WHERE post_id = ?;`
  const params = req.params.id

  postsPool.query(deletePostQuery, [params], (error, results, fields) => {
    if (error) {
      console.error("Error deleting post:", error)
      res.status(400).send("Bad Request")
      return
    }
    console.log("Post deleted successfully")
    postsPool.query(deleteLikeQuery, [params], (error, results, fields) => {
      if (error) {
        console.error("Error deleting likes:", error)
        res.status(400).send("Bad Request")
        return
      }
      console.log("Likes deleted successfully")
    })
    res.status(202).send("Accepted")
  })
})

async function getPosts() {
  return new Promise((resolve, reject) => {
    postsPool.query(
      `SELECT *, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') AS formatted_createdAt FROM posts INNER JOIN user ON posts.user_Id=user.user_id;`,
      function (error, results, fields) {
        // console.log("results in post.js:", results)
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
            replyTo: result.replyTo,
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
