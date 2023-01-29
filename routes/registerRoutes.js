const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const router = express.Router()
const bodyParser = require("body-parser")

app.set("view engine", "ejs")
app.set("views", "./views")
// app.use(expressLayouts)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

router.get("/", (req, res, next) => {
  res.status(200).render("register")
})

router.post("/", (req, res, next) => {
  console.log(req.body)
  let firstName = req.body.FirstName.trim()
  let lastName = req.body.LastName.trim()
  let username = req.body.username.trim()
  let email = req.body.email.trim()
  let password = req.body.password
  let payload = req.body

  if (firstName && lastName && username && email && password) {
  } else {
    payload.errMessage = "請填寫完整資訊"
    res.status(200).render("register", payload)
  }
})

module.exports = router
