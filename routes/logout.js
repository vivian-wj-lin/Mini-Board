// console.log("logout.js is running")

const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const User = require("../schemas/UserSchema")

// app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", (req, res, next) => {
  // res.status(200).render("login")
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/login")
    })
  }
})

module.exports = router
