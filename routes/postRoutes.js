console.log("loginRoutes.js is running")

const express = require("express")
const app = express()
const expressLayouts = require("express-ejs-layouts")
const router = express.Router()
const bodyParser = require("body-parser")
const { userPool } = require("../schemas/user")

router.get("/:id", (req, res, next) => {
  let payload = {
    pageTitle: "View post",
    userLoggedIn: req.session.user,
    userId: req.session.user["user_id"],
    locals: { userId: req.session.user["user_id"] },
    postId: req.params.id,
  }

  res.status(200).render("postPage", payload)
})

module.exports = router
