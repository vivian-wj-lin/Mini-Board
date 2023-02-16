const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const User = require("../../schemas/UserSchema")
const Post = require("../../schemas/postSchema")
const AWS = require("aws-sdk")
const S3 = require("aws-sdk/clients/s3")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", async (req, res, next) => {
  Post.find()
    .populate("postedBy")
    .sort({ createdAt: -1 })
    .then((results) => {
      res.status(200).send(results)
    })
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
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
  console.log("req.body in BE:", req.body)
  console.log("req.body.content in BE:", req.body.content)

  if (!req.body.content) {
    console.log("Content param not sent with request")
    return res.sendStatus(400)
  }
  let timestamp = new Date().getTime()
  let timestampString = new Date(timestamp).toLocaleString()
  let RDSUrl = null

  //post both img and txt msg
  if (req.body.imagedata) {
    let imgResult = req.body.imagedata
    let time = new Date().getTime()
    let imageBuffer = new Buffer.from(
      imgResult.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    )
    console.log("imageBuffer:", imageBuffer)
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
        console.log("RDSUrl:", RDSUrl)
        console.log("req.body in posts.js:", req.body)
        let postData = {
          content: req.body.content,
          imageUrl: RDSUrl,
          postedBy: req.session.user,
        }
        Post.create(postData)
          .then(async (newPost) => {
            console.log("newPost created:", newPost)
            newPost = await User.populate(newPost, { path: "postedBy" })
            console.log("newPost populated with User:", newPost)
            res.status(201).send(newPost)
          })
          .catch((error) => {
            console.log(error)
            res.sendStatus(400)
          })
        console.log("uploaded to s3")
      }
    })
  }

  //post only txt msg
  else {
    let postData = {
      content: req.body.content,
      postedBy: req.session.user,
    }
    Post.create(postData)
      .then(async (newPost) => {
        newPost = await User.populate(newPost, { path: "postedBy" })

        res.status(201).send(newPost)
      })
      .catch((error) => {
        console.log(error)
        res.sendStatus(400)
      })
  }
})

router.delete("/:id", (req, res, next) => {
  console.log("req.params.id:", req.params.id)
})

async function getPosts() {}

module.exports = router
