const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const middleware = require("./middleware")
const path = require("path")

app.set("view engine", "ejs")
app.set("views", "./views")
// app.set("layout", "layouts")
// app.set("layout", "layouts/main-layout")
// app.set("layout", "layouts/login-layout")
app.set("layout", "register")
app.use(expressLayouts)

app.use(express.static(path.join(__dirname, "public")))

//Routes
const loginRoute = require("./routes/loginRoutes")
const registerRoute = require("./routes/registerRoutes")

app.use("/login", loginRoute)
app.use("/register", registerRoute)

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    indexTitle: "come and share!",
  }
  res.status(200).render("index", payload)
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
