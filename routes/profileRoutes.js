// const express = require("express")
// const app = express()
// const router = express.Router()
// const bodyParser = require("body-parser")
// const User = require("../schemas/user")
// const { userPool } = require("../schemas/user")

// router.get("/", (req, res, next) => {
//   let payload = {
//     pageTitle: req.session.user.username,
//     userLoggedIn: req.session.user,
//     userLoggedInJs: JSON.stringify(req.session.user),
//     profileUser: req.session.user,
//   }

//   res.status(200).render("profilePage", payload)
// })

// router.get("/:username", async (req, res, next) => {
//   let payload = await getPayload(req.params.username, req.session.user)
//   console.log(payload)

//   res.status(200).render("profilePage", payload)
// })

// async function getPayload(username, userLoggedIn) {
//   const query = `SELECT username FROM user WHERE username = ?`
//   const parameters = username
//   console.log("parameters:", parameters)

//   return new Promise((resolve, reject) => {
//     userPool.query(query, parameters, (error, results, fields) => {
//       if (error) {
//         console.error("Error executing query:", error)
//         reject(error)
//         return
//       }

//       if (results.length === 0) {
//         resolve({
//           pageTitle: "User not found",
//           userLoggedIn: userLoggedIn,
//           userLoggedInJs: JSON.stringify(userLoggedIn),
//         })
//         return
//       }

//       console.log('results[0]["username"]:', results[0]["username"])
//       console.log("userLoggedIn:", userLoggedIn)
//       console.log("JSON.stringify(userLoggedIn):", JSON.stringify(userLoggedIn))

//       resolve({
//         pageTitle: results[0]["username"],
//         userLoggedIn: userLoggedIn,
//         userLoggedInJs: JSON.stringify(userLoggedIn),
//         profileUser: results[0]["username"],
//       })
//     })
//   })
// }

// module.exports = router
