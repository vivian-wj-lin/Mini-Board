const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const middleware = require("./middleware")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")

app.set("view engine", "ejs")
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

app.use("/login", loginRoute)
// console.log("/login routes are mounted")
app.use("/register", registerRoute)
app.use("/logout", loginRoute)

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    indexTitle: "Home",
    userLoggedIn: req.session.user,
  }
  // console.log("user in session:", req.session.user)
  // console.log("payload:", payload)
  // console.log("req.session:", req.session)
  // console.log("payload.userLoggedIn:", payload.userLoggedIn)
  // console.log("payload.userLoggedIn.username:", payload.userLoggedIn.username)
  res.status(200).render("index", payload)
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
