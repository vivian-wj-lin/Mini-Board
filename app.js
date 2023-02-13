const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const middleware = require("./middleware")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const { likesPool } = require("./schemas/likeSchema.js")
const like = require("./schemas/likeSchema.js")
const S3 = require("aws-sdk/clients/s3")
const AWS = require("aws-sdk")
const mysql = require("mysql")
const pool = mysql.createPool({
  host: process.env.AWS_Myslq_Host,
  user: "admin",
  password: process.env.AWS_Myslq_Password,
  database: "msg_board",
  port: 3306,
})

app.set("view engine", "pug")
app.set("views", "./views")
// app.set("layout", "register")
// app.use(expressLayouts)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))

app.use(
  session({
    secret: "morning",
    resave: true,
    saveUninitialized: false,
  })
)

//Routes
const loginRoute = require("./routes/loginRoutes")
const registerRoute = require("./routes/registerRoutes")
const logoutRoute = require("./routes/logout")
const postRoute = require("./routes/postRoutes")
const profileRoute = require("./routes/profileRoutes")

//Api routes
const postsApiRoute = require("./routes/api/posts")
const likesApiRoute = require("./routes/api/likes")

app.use("/login", loginRoute)
app.use("/register", registerRoute)
app.use("/logout", logoutRoute)
app.use("/posts", middleware.requireLogin, postRoute)
app.use("/profile", middleware.requireLogin, profileRoute)

app.use("/api/posts", postsApiRoute)
app.use("/api/likes", likesApiRoute)

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: "Home",
    userLoggedIn: req.session.user,
    userId: req.session.user["user_id"],
    locals: { userId: req.session.user["user_id"] },
  }
  console.log("user in session:", req.session.user)
  console.log(req.session.user["user_id"])
  // console.log("userId:", userId)
  // console.log("payload:", payload)
  // console.log("req.session:", req.session)
  // console.log("payload.userLoggedIn:", payload.userLoggedIn)
  // console.log("payload.userLoggedIn.username:", payload.userLoggedIn.username)
  res.status(200).render("home", payload)
})

app.post("/upload", (req, res) => {
  const result = req.body
  const msgResult = result.textinput
  const imgResult = result.imagedata
  // console.log(result)
  // console.log(msgResult)
  // console.log(imgResult)
  let time = new Date().getTime()
  let imageBuffer = new Buffer.from(
    imgResult.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  )
  // console.log(imageBuffer)
  const params = {
    Bucket: "msg-board-s3-bucket",
    Key: `msgboard/${time}`,
    Body: imageBuffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
    // ContentType: "mime/type",
  }
  // const s3 = new S3({ region, accessKeyId, secretAccessKey })

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
      console.log("uploaded to s3")
      RDSUrl = "https://dk0tbawkd0lmu.cloudfront.net" + `/msgboard/${time}`
      // console.log(RDSUrl)
      pool.getConnection(function (err, connection) {
        let sql = "insert msg(txtContent, imgContent) values(?,?);"
        connection.query(
          sql,
          [msgResult, RDSUrl],
          function (error, res, fields) {
            if (error) {
              console.log(error)
              reject(error)
            } else {
              // resolve(RDSUrl)
              console.log("uploaded to RDS")
            }
          }
        )
        connection.release()
      })
      res.status(200).json({ result: "ok" })
    }
  })
})

app.post("/api/likes", (req, res, next) => {
  // res.status(200).send("api/like worked")
  if (!req.body) {
    return res.status(400).send({
      error: "no content",
    })
  }
  console.log("req.body:", req.body)
  let userId = req.body.userId
  console.log("userId in app.js:", userId)
  let postId = req.body.postId
  console.log("postId in app.js:", postId)
  let timestamp = new Date().getTime()
  let timestampString = new Date(timestamp).toLocaleString()
  likesPool.query(
    `INSERT INTO likes (post_id, user_id, like_timestampfromFE ) VALUES ( ?, ?, ?)`,
    [postId, userId, timestampString],

    function (error, results, fields) {
      if (error) {
        console.log(error)
        res.sendStatus(400)
      } else {
        let likesData = {
          postId: postId,
          userId: userId,
          timestamp: timestampString,
        }
        return res.status(201).send(likesData)
      }
      console.log("likesData:", likesData)
    }
  )
})

app.get("/api/likes", (req, res, next) => {
  console.log("getting the likes api")
  likesPool.query(
    `SELECT * FROM likes;
`,
    function async(error, results, fields) {
      if (error) {
        console.log(error)
        res.sendStatus(400)
      } else {
        const likesData = results.map((result) => ({
          postId: result.post_id,
          userId: result.user_id,
          timestamp: result.like_timestampfromFE,
        }))
        res.status(200).send(likesData)
        console.log(likesData)
      }
    }
  )
})

app.delete("/api/likes", (req, res, next) => {
  const { userId, postId } = req.body
  likesPool.query(
    `DELETE FROM likes WHERE user_id = ${userId} AND post_id = ${postId};`,
    function (error, results, fields) {
      if (error) {
        console.log(error)
        res.sendStatus(400)
      } else {
        res.status(200).send("Like successfully removed")
      }
    }
  )
})

app.get("/api/like-count", (req, res) => {
  let query = `SELECT post_id, COUNT(*) as likeCount FROM likes GROUP BY post_id;`

  likesPool.query(query, (error, result) => {
    if (error) {
      console.error("Error retrieving like count:", error)
      return res.status(500).send({ error: "Error retrieving like count" })
    }

    res.send(result)
    // console.log("likeCount:", result)
  })
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
