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
  let searchObj = req.query
  //value of the searchObj:  { postedBy: profileUserId }
  // console.log("searchObj:", searchObj)
  if (searchObj.isReply !== undefined) {
    let isReply = searchObj.isReply == "true"
    searchObj.replyTo = { $exists: isReply }
    delete searchObj.isReply
    console.log("searchObj:", searchObj)
  }
  let results = await getPosts(searchObj)
  res.status(200).send(results)
})

router.get("/:id", async (req, res, next) => {
  // return res.status(200).send("This is awesome")
  let postId = req.params.id
  let postData = await getPosts({ _id: postId })
  postData = postData[0]

  let results = {
    postData: postData,
  }

  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo
  }

  results.replies = await getPosts({ replyTo: postId }) //filter passed into getPosts

  // console.log("results.replies", results.replies)
  res.status(200).send(results)
})

router.post("/", (req, res, next) => {
  // console.log("req.body in BE:", req.body)
  // console.log("req.body.content in BE:", req.body.content)
  // if (req.body.replyTo) {
  //   console.log("req.body.replyTo:", req.body.replyTo)
  //   return res.sendStatus(400)
  // }

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
        console.log("RDSUrl:", RDSUrl)
        console.log("req.body in posts.js:", req.body)
        let postData = {
          content: req.body.content,
          imageUrl: RDSUrl,
          postedBy: req.session.user,
        }

        if (req.body.replyTo) {
          postData.replyTo = req.body.replyTo
        }

        Post.create(postData)
          .then(async (newPost) => {
            // console.log("newPost created:", newPost)
            newPost = await User.populate(newPost, { path: "postedBy" })
            // console.log("newPost populated with User:", newPost)
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

    if (req.body.replyTo) {
      postData.replyTo = req.body.replyTo
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

router.put("/:id/like", async (req, res, next) => {
  let postId = req.params.id
  let userId = req.session.user._id
  // console.log("req.params.id in line 144:", req.params.id)
  let isLiked =
    req.session.user.likes && req.session.user.likes.includes(postId)
  // console.log("isLiked:", isLiked)

  let option = isLiked ? "$pull" : "$addToSet"

  console.log("Is liked: " + isLiked)
  console.log("Option: " + option)
  console.log("UserId: " + userId)

  // Insert user like
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { likes: postId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  // Insert post like
  let post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { likes: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  res.status(200).send(post)
})

router.post("/:id/retweet", async (req, res, next) => {
  let postId = req.params.id
  let userId = req.session.user._id

  //try and delete retweet:
  let deletedPost = await Post.findOneAndDelete({
    postedBy: userId,
    retweetData: postId,
  }).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })

  let option = deletedPost != null ? "$pull" : "$addToSet"
  let repost = deletedPost
  if (repost == null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
      (error) => {
        console.log(error)
        res.sendStatus(400)
      }
    )
  }
  // either add the repost to user's retweet or remove it
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { retweets: repost._id } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  // Insert post like
  let post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { retweetUsers: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  res.status(200).send(post)
})

router.delete("/:id", (req, res, next) => {
  // console.log("req.params.id:", req.params.id)
  Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
})

async function getPosts(filter) {
  let results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ createdAt: -1 })
    .catch((error) => {
      console.log(error)
    })
  results = await User.populate(results, {
    path: "replyTo.postedBy",
  })
  return await User.populate(results, {
    path: "retweetData.postedBy",
  })
}

module.exports = router
