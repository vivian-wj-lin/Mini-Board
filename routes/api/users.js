const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const multer = require("multer")
const upload = multer({ dest: "" })
const User = require("../../schemas/UserSchema")
const Post = require("../../schemas/postSchema")
const Notification = require("../../schemas/NotificationSchema")
const AWS = require("aws-sdk")

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", async (req, res, next) => {
  let searchObj = req.query

  if (req.query.search !== undefined) {
    searchObj = {
      $or: [
        { username: { $regex: req.query.search, $options: "i" } },
        { accountname: { $regex: req.query.search, $options: "i" } },
      ],
    }
  }

  User.find(searchObj)
    .then((results) => res.status(200).send(results))
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
})

router.put("/:userId/follow", async (req, res, next) => {
  let userId = req.params.userId

  let user = await User.findById(userId)

  if (user == null) {
    return res.sendStatus(404)
  }

  let isFollowing =
    user.followers && user.followers.includes(req.session.user._id)
  let option = isFollowing ? "$pull" : "$addToSet"

  req.session.user = await User.findByIdAndUpdate(
    req.session.user._id,
    { [option]: { following: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })

  User.findByIdAndUpdate(userId, {
    [option]: { followers: req.session.user._id },
  }).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })

  if (!isFollowing) {
    await Notification.insertNotification(
      userId,
      req.session.user._id,
      "follow",
      req.session.user._id
    )
  }
  res.status(200).send(req.session.user)
})

router.get("/:userId/following", async (req, res, next) => {
  User.findById(req.params.userId)
    .populate("following")
    .then((results) => {
      res.status(200).send(results)
    })
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
})

router.get("/:userId/followers", async (req, res, next) => {
  User.findById(req.params.userId)
    .populate("followers")
    .then((results) => {
      res.status(200).send(results)
    })
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
})

router.post(
  "/profilePicture",
  upload.single("croppedImage"),
  async (req, res, next) => {
    if (!req.file) {
      //req.file is retrieved with multer
      console.log("No file uploaded with ajax request.")
      return res.sendStatus(400)
    }
    // console.log("req.file:", req.file)
    const time = Date.now()

    const params = {
      Bucket: "msg-board-s3-bucket",
      Key: `msgboard/${time}`,
      Body: req.file.buffer,
      ContentType: "image/png",
    }

    s3.upload(params, async (err, data) => {
      if (err) {
        console.log(err)
        res.status(500).json({ result: "error" })
      } else {
        RDSUrl = "https://dk0tbawkd0lmu.cloudfront.net" + `/msgboard/${time}`
        console.log("RDSUrl:", RDSUrl)

        req.session.user = await User.findByIdAndUpdate(
          req.session.user._id,
          {
            profilePic: RDSUrl,
          },
          { new: true }
        )
        res.status(200).json({ result: "success", RDSUrl: RDSUrl })
      }
    })
  }
)

router.post(
  "/coverPhoto",
  upload.single("croppedImage"),
  async (req, res, next) => {
    if (!req.file) {
      //req.file is retrieved with multer
      console.log("No file uploaded with ajax request.")
      return res.sendStatus(400)
    }
    // console.log("req.file:", req.file)
    const time = Date.now()

    const params = {
      Bucket: "msg-board-s3-bucket",
      Key: `msgboard/${time}`,
      Body: req.file.buffer,
      ContentType: "image/png",
    }

    s3.upload(params, async (err, data) => {
      if (err) {
        console.log(err)
        res.status(500).json({ result: "error" })
      } else {
        RDSUrl = "https://dk0tbawkd0lmu.cloudfront.net" + `/msgboard/${time}`
        console.log("RDSUrl:", RDSUrl)

        req.session.user = await User.findByIdAndUpdate(
          req.session.user._id,
          {
            coverPhoto: RDSUrl,
          },
          { new: true }
        )
        res.status(200).json({ result: "success", RDSUrl: RDSUrl })
      }
    })
  }
)

module.exports = router
