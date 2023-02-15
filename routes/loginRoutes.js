const express = require("express")
const app = express()
const router = express.Router()
// const bodyParser = require("body-parser")
const { userPool } = require("../schemas/user")

app.set("view engine", "pug")
app.set("views", "./views")

// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", (req, res, next) => {
  res.status(200).render("login")
})

router.post("/", (req, res, next) => {
  let username = req.body.logUsername.trim()
  let password = req.body.logPassword
  let payload = req.body

  if (username && password) {
    let sql = `SELECT * FROM user WHERE username = ?`
    let values = [username]
    userPool.query(sql, values, (error, results) => {
      if (error) {
        throw error
      }

      if (results && results.length > 0) {
        let user = results[0]
        if (user.password === password) {
          req.session.user = user
          console.log("user:", user)
          return res.redirect("/")
        } else {
          payload.errorMessage = "輸入不正確"
          res.status(200).render("login", payload)
        }
      } else {
        payload.errorMessage = "輸入不正確"
        res.status(200).render("login", payload)
      }
    })
  } else {
    payload.errorMessage = "請填寫正確資訊"
    res.status(200).render("login", payload)
  }
})

module.exports = router
