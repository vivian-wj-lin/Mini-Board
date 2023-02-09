$(document).ready(() => {
  // alert("home.js worked")
  $.get("/api/posts", (results) => {
    // console.log(results)
    outputPosts(results, $(".postsContainer"))
  })
})
