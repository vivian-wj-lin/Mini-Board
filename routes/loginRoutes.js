const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const User = require("../schemas/UserSchema")

app.set("view engine", "pug")
app.set("views", "./views")

app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", (req, res, next) => {
  res.status(200).render("login")
})

router.post("/", async (req, res, next) => {
  let payload = req.body

  if (req.body.logAccountname && req.body.logPassword) {
    let user = await User.findOne({
      $or: [
        { accountname: req.body.logAccountname },
        { email: req.body.logAccountname },
      ],
    }).catch((error) => {
      console.log(error)
      payload.errorMessage = "Something went wrong."
      res.status(200).render("login", payload)
    })

    if (user != null) {
      let result = await bcrypt.compare(req.body.logPassword, user.password)
      if (result === true) {
        req.session.user = user
        return res.redirect("/")
      }
    }
    payload.errorMessage = "請填寫正確資訊"
    return res.status(200).render("login", payload)
  }
  payload.errorMessage = "請填寫正確資訊"
  res.status(200).render("login")
})

module.exports = router
