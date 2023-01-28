const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const router = express.Router()

app.set("view engine", "ejs")
app.set("views", "./views")
app.set("layout", "layouts/login-layout")
app.use(expressLayouts)

router.get("/", (req, res, next) => {
  res.status(200).render("login")
})

module.exports = router
