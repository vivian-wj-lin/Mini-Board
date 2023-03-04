let connected = false

// let socket = io("http://localhost:3000")
// let socket = io("https://bluemagpiesharing.com")
let socket = io("")

socket.emit("setup", userLoggedIn)

socket.on("connect", () => (connected = true))
socket.on("message received", (newMessage) => messageReceived(newMessage))

socket.on("notification received", (newNotification) => {
  // console.log("new notification")
  $.get("/api/notifications/latest", (notificationData) => {
    refreshNotificationsBadge()
  })
})

function emitNotification(userId) {
  if (userId == userLoggedIn._id) return

  socket.emit("notification received", userId)
}
