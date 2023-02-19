$(document).ready(() => {
  $.get("/api/posts/" + postId, (results) => {
    // console.log(results)
    outputPostsWithReplies(results, $(".postsContainer"))
    console.log("outputPostsWithReplies:", results)
  })
})
