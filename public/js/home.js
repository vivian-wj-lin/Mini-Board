$(document).ready(() => {
  $.get("/api/posts", (results) => {
    // console.log("/api/posts in home.js:", results) //all posts
    outputPosts(results, $(".postsContainer"))
  })
})


