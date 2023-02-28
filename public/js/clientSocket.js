let connected = false

let socket = io("http://localhost:3000")
// let socket = io("https://bluemagpiesharing.com/")

socket.emit("setup", userLoggedIn)

socket.on("connect", () => (connected = true))
socket.on("message received", (newMessage) => messageReceived(newMessage))
