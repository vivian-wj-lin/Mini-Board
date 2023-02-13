$(document).ready(() => {
  // alert("home.js worked")
  $.get("/api/posts", (results) => {
    console.log("/api/posts:", results)
    outputPosts(results, $(".postsContainer"))
  })
})
