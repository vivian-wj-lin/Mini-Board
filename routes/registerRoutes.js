const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../schemas/user")

app.set("view engine", "pug")
app.set("views", "./views")
// app.use(expressLayouts)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

router.get("/", (req, res, next) => {
  res.status(200).render("register")
})

router.post("/", (req, res, next) => {
  console.log(req.body)
  let username = req.body.username.trim()
  let email = req.body.email.trim()
  let password = req.body.password
  let payload = req.body

  if (username && email && password) {
    let sql = `SELECT * FROM user WHERE username = ? OR email = ?`
    let values = [username, email]
    userPool.query(sql, values, (error, results) => {
      if (error) throw error
      if (results.length > 0) {
        payload.errorMessage = "使用者名稱或電子信箱已存在"
        res.status(200).render("register", payload)
      } else {
        // inserting a new user
        let insertSql = `INSERT INTO user (username, email, password) VALUES (?,?,?)`
        let insertValues = [username, email, password]

        userPool.query(insertSql, insertValues, (error, results) => {
          if (error) throw error
          // payload.successMessage = "註冊成功，請登入"
          // res.status(200).render("register", payload)
          req.session.user = {
            username: insertValues[0],
            email: insertValues[1],
          }
          return res.redirect("/")
        })
      }
    })
  } else {
    payload.errorMessage = "請填寫完整資訊"
    res.status(200).render("register", payload)
  }
})

module.exports = router
