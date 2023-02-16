$(document).ready(() => {
  $.get("/api/posts", (results) => {
    // console.log("/api/posts in home.js:", results) //all posts
    outputPosts(results, $(".postsContainer"))
  })
})

function outputPosts(results, container) {
  container.html("")

  results.forEach((result) => {
    let html = createPostHtml(result)
    container.append(html)
  })

  if (results.length == 0) {
    container.append("<span class='noResults'>Nothing to show.</span>")
  }
}
