console.log("posts.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../../schemas/user")
const { postsPool } = require("../../schemas/postSchema")
const User = require("../../schemas/user")
// const Post = require("../../schemas/PostSchema")
const S3 = require("aws-sdk/clients/s3")
const AWS = require("aws-sdk")
const mysql = require("mysql2")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", async (req, res, next) => {
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
    console.log("Content param not sent with request")
    return res.sendStatus(400)
  }

  let timestamp = new Date().getTime()
  let timestampString = new Date(timestamp).toLocaleString()
  let RDSUrl = null
  console.log("req.body.relyTo:", req.body.replyTo)
  // console.log("postData in post.js line 65:", postData)

  // if (req.body.replyTo) {
  //   postData.replyTo = req.body.replyTo
  // }

  if (req.body.imagedata) {
    let imgResult = req.body.imagedata
    let time = new Date().getTime()
    let imageBuffer = new Buffer.from(
      imgResult.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    )
    // console.log("imageBuffer:", imageBuffer)
    const params = {
      Bucket: "msg-board-s3-bucket",
      Key: `msgboard/${time}`,
      Body: imageBuffer,
      ContentEncoding: "base64",
      ContentType: "image/png",
    }

    const region = process.env.AWS_region
    const Bucket = process.env.AWS_BUCKET_NAME
    const accessKeyId = process.env.AWS_ACCESS_KEY
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

    AWS.config.update({
      Bucket: Bucket,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    })

    const s3 = new S3()
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err)
        res.status(500).json({ result: "error" })
      } else {
        RDSUrl = "https://dk0tbawkd0lmu.cloudfront.net" + `/msgboard/${time}`
        console.log(RDSUrl)
        console.log("req.body in posts.js:", req.body)
        let postData = {
          content: req.body.content,
          imagedata: RDSUrl,
          postedBy: { ...req.session.user, imagedata: RDSUrl },
        }
        if (req.body.replyTo) {
          postData.replyTo = req.body.replyTo
        }

        postsPool.getConnection(function (err, connection) {
          let sql =
            "INSERT INTO posts (content, user_Id, username,imageURL, timefromFE,replyTo ) VALUES (?, ?, ?, ?, ?, ?);"
          postsPool.query(
            sql,
            [
              postData.content,
              postData.postedBy["user_id"],
              postData.postedBy["username"],
              RDSUrl,
              timestampString,
              postData.replyTo,
            ],
            function (error, res, fields) {
              if (error) {
                console.log(error)
                reject(error)
              } else {
                console.log("uploaded to RDS")
              }
            }
          )
          connection.release()
        })
        console.log("uploaded to s3")

        res.status(200).send(postData)
      }
    })
  } else {
    let postData = {
      content: req.body.content,
      postedBy: req.session.user,
    }
    if (req.body.replyTo) {
      postData.replyTo = req.body.replyTo
    }

    postsPool.getConnection(function (err, connection) {
      let sql =
        "INSERT INTO posts (content, user_Id, username, timefromFE,replyTo ) VALUES (?, ?, ?, ?, ?);"
      postsPool.query(
        sql,
        [
          postData.content,
          postData.postedBy["user_id"],
          postData.postedBy["username"],
          timestampString,
          postData.replyTo,
        ],
        function (error, res, fields) {
          if (error) {
            console.log(error)
            reject(error)
          } else {
            console.log("uploaded to RDS")
          }
        }
      )
      connection.release()
    })

    res.status(200).send(postData)
  }
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
              // createdAt: result.createdAt,
              // updatedAt: result.updatedAt,
              pinned: result.pinned,
              imagedata: result.imageURL,
              user_id: result.user_id,
              email: result.email,
              password: result.password,
              profilePic: result.profilePic,
              // formatted_createdAt: result.formatted_createdAt,
              timefromFE: result.timefromFE,
            },
            replyTo: result.replyTo,
          }))
          postData.sort(function (a, b) {
            return new Date(b.postedBy.posts_Id) - new Date(a.postedBy.posts_Id)
          })
          // console.log("postData in post.js lin 233:", postData)
          resolve(postData)
        }
      }
    )
  })
}

module.exports = router
