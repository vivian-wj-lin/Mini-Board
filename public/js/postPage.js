$(document).ready(() => {
  $.get("/api/posts/" + postId, (results) => {
    // console.log(results)
    outputPosts(results, $(".postsContainer"))
  })
})
