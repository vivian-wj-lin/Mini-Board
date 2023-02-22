const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const User = require("../schemas/UserSchema")

router.get("/", (req, res, next) => {
  let payload = {
    pageTitle: req.session.user.accountname,
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
    profileUser: req.session.user,
  }

  res.status(200).render("profilePage", payload)
})

router.get("/:accountname", async (req, res, next) => {
  let payload = await getPayload(req.params.accountname, req.session.user)
  res.status(200).render("profilePage", payload)
})

router.get("/:accountname/replies", async (req, res, next) => {
  let payload = await getPayload(req.params.accountname, req.session.user)
  payload.selectedTab = "replies"
  res.status(200).render("profilePage", payload)
})

router.get("/:accountname/following", async (req, res, next) => {
  let payload = await getPayload(req.params.accountname, req.session.user)
  payload.selectedTab = "following"
  res.status(200).render("followersAndFollowing", payload)
})

router.get("/:accountname/followers", async (req, res, next) => {
  let payload = await getPayload(req.params.accountname, req.session.user)
  payload.selectedTab = "followers"
  res.status(200).render("followersAndFollowing", payload)
})

async function getPayload(accountname, userLoggedIn) {
  let user = await User.findOne({ accountname: accountname })

  if (user == null) {
    user = await User.findById(accountname)

    if (user == null) {
      return {
        pageTitle: "User not found 查無使用者",
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
      }
    }
  }
  return {
    pageTitle: user.accountname,
    userLoggedIn: userLoggedIn,
    userLoggedInJs: JSON.stringify(userLoggedIn),
    profileUser: user,
  }
}

module.exports = router
