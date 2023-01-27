const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const middleware = require("./middleware")

app.set("view engine", "ejs")
app.set("views", "./views")
app.use(expressLayouts)

app.use(express.static("public"))

//Routes
const loginRoute = require("./routes/loginRoutes")

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    indexTitle: "come and share!",
  }
  res.status(200).render("index", payload)
})

app.listen(3000, function () {
  console.log("server is listening on port 3000")
})
