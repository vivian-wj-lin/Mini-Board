const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const middleware = require("./middleware")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const { likesPool } = require("./schemas/likeSchema.js")
const like = require("./schemas/likeSchema.js")

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

//Api routes
const postsApiRoute = require("./routes/api/posts")
const likesApiRoute = require("./routes/api/likes")

app.use("/login", loginRoute)
// console.log("/login routes are mounted")
app.use("/register", registerRoute)
app.use("/logout", loginRoute)

app.use("/api/posts", postsApiRoute)
app.use("/api/likes", likesApiRoute)

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: "Home",
    userLoggedIn: req.session.user,
    userId: req.session.user["user_id"],
  }
  console.log("user in session:", req.session.user)
  console.log(req.session.user["user_id"])
  // console.log("userId:", userId)
  // console.log("payload:", payload)
  // console.log("req.session:", req.session)
  // console.log("payload.userLoggedIn:", payload.userLoggedIn)
  // console.log("payload.userLoggedIn.username:", payload.userLoggedIn.username)
  res.status(200).render("home", {
    pageTitle: "Home",
    userLoggedIn: req.session.user,
    userId: req.session.user["user_id"],
    locals: { userId: req.session.user["user_id"] },
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
    console.log("likeCount:", result)
  })
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
