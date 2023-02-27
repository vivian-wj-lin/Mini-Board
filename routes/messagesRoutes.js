const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const User = require("../schemas/UserSchema")
const Chat = require("../schemas/ChatSchema")

router.get("/", (req, res, next) => {
  res.status(200).render("inboxPage", {
    pageTitle: "Inbox",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  })
})

router.get("/new", (req, res, next) => {
  res.status(200).render("newMessage", {
    pageTitle: "New message",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  })
})

router.get("/:chatId", async (req, res, next) => {
  let userId = req.session.user._id
  let chatId = req.params.chatId
  let isValidId = mongoose.isValidObjectId(chatId)

  let payload = {
    pageTitle: "Chat",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  }

  if (!isValidId) {
    payload.errorMessage =
      "Chat does not exist or you do not have permission to view it. 聊天室不存在，或無查看權限"
    return res.status(200).render("chatPage", payload)
  }

  //check if the user is part of the chat
  let chat = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  }).populate("users")

  if (chat == null) {
    //check if chat id is really user id
    let userFound = await User.findById(chatId)

    if (userFound != null) {
      // the one-on-one envelope icon chat
      //get chat using user id
      chat = await getChatByUserId(userFound._id, userId)
    }
  }

  if (chat == null) {
    payload.errorMessage =
      "Chat does not exist or you do not have permission to see it. 聊天室不存在，或無查看權限"
  } else {
    payload.chat = chat
  }

  res.status(200).render("chatPage", payload)
})

// the one-on-one envelope icon chat
function getChatByUserId(userLoggedInId, otherUserId) {
  return Chat.findOneAndUpdate(
    //filters
    {
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) } },
          { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } },
          //   { $elemMatch: { $eq: userLoggedInId } },
          //   { $elemMatch: { $eq: otherUserId } },
        ],
      },
    },
    {
      //parameters for creating one
      $setOnInsert: {
        users: [userLoggedInId, otherUserId],
      },
    },
    {
      new: true, //return the newly updated data
      upsert: true, //create a row if it wasn't found
    }
  ).populate("users")
}

module.exports = router
