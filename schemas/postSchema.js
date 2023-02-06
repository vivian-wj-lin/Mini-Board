require("dotenv").config()

const express = require("express")
const app = express()
const cors = require("cors")
const S3 = require("aws-sdk/clients/s3")
const AWS = require("aws-sdk")
const mysql2 = require("mysql2")
const pool = mysql2.createPool({
  host: process.env.AWS_Mysql_Host,
  user: process.env.AWS_Mysql_User,
  password: process.env.AWS_Mysql_Password,
  database: "twitter_clone",
  port: 3306,
})

const bodyParser = require("body-parser")
app.use(bodyParser.json({ limit: "200mb" }))

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack)
    return
  }
  // console.log("Connected to MySQL as id " + connection.threadId)
})

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack)
    return
  }

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS posts (
      posts_Id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
      user_Id int NOT NULL,
      username VARCHAR(500) NOT NULL,
      content VARCHAR(500),
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      pinned BOOLEAN,
      imageURL VARCHAR(5000),
      FOREIGN KEY (user_Id) REFERENCES user(user_id),
      timefromFE VARCHAR(500)
);

  `
  connection.query(createTableQuery, (error, results) => {
    if (error) {
      console.error("Error creating table: " + error.stack)
      return
    }
    console.log("Post table created/runs successfully.")
  })

  connection.release()
})

module.exports = { postsPool: pool }
