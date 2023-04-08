const mongoose = require("mongoose")
mongoose.set("strictQuery", true)

class Database {
  constructor() {
    this.connect()
  }

  connect() {
    mongoose
      .connect(
        "mongodb+srv://test:test@cluster0.ysgkdvn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      )
      .then(() => {
        console.log("database connection successful")
      })
      .catch((err) => {
        console.log("database connection error " + err)
      })
  }
}

module.exports = new Database()
