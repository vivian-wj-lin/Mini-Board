console.log("loginRoutes.js is running")

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
  // console.log("GET /login route is running")
  res.status(200).render("login")
})

// console.log("before the POST for /login")
router.post("/", (req, res, next) => {
  // console.log("Request Object:", req)
  // console.log("Response Object:", res)
  // console.log("POST /login route started")
  // console.log("Received request body:", req.body)
  let username = req.body.logUsername.trim()
  let password = req.body.logPassword
  let payload = req.body

  // console.log("Username:", username)
  // console.log("Password:", password)
  // console.log("Payload:", payload)

  if (username && password) {
    // console.log("Username and password are present in the request body")
    let sql = `SELECT * FROM user WHERE username = ?`
    let values = [username]
    // console.log("Before query")
    userPool.query(sql, values, (error, results) => {
      // console.log("Querying database for user data")
      if (error) {
        // console.error("Error querying database:", error)
        throw error
      }
      // console.log("Query Results:", results)

      if (results && results.length > 0) {
        // console.log("Found user in the database")
        let user = results[0]
        // console.log("User:", user)
        if (user.password === password) {
          // console.log("User's password matches the input")
          // console.log("Sending response to client")
          req.session.user = { username: user.username }
          return res.redirect("/")
        } else {
          // console.log("User's password does not match the input")
          payload.errorMessage = "輸入不正確"
          res.status(200).render("login", payload)
        }
      } else {
        // console.log("User not found in the database")
        payload.errorMessage = "輸入不正確"
        res.status(200).render("login", payload)
      }
    })
  } else {
    // console.log("Username and/or password is not present in the request body")
    payload.errorMessage = "請填寫正確資訊"
    res.status(200).render("login", payload)
  }
  // console.log("After query")
  // console.log("POST /login route ended")
})

module.exports = router
