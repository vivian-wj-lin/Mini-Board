const express = require("express")
const app = express()
const middleware = require("./middleware")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const mongoose = require("./database")

app.set("view engine", "pug")
app.set("views", "./views")

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
const searchRoute = require("./routes/searchRoutes")
const messagesRoute = require("./routes/messagesRoutes")

//Api routes
const postsApiRoute = require("./routes/api/posts")
const usersApiRoute = require("./routes/api/users")
const chatsApiRoute = require("./routes/api/chats")
const messageApiRoute = require("./routes/api/messages")

app.use("/login", loginRoute)
app.use("/register", registerRoute)
app.use("/logout", logoutRoute)
app.use("/posts", middleware.requireLogin, postRoute)
app.use("/profile", middleware.requireLogin, profileRoute)
app.use("/search", middleware.requireLogin, searchRoute)
app.use("/messages", middleware.requireLogin, messagesRoute)

app.use("/api/posts", postsApiRoute)
app.use("/api/users", usersApiRoute)
app.use("/api/chats", chatsApiRoute)
app.use("/api/messages", messageApiRoute)

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: "Home",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  }
  // console.log("user in session:", req.session.user)
  // console.log(req.session.user["user_id"])
  res.status(200).render("home", payload)
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
