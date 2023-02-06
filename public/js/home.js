$(document).ready(() => {
  // alert("home.js worked")
  $.get("/api/posts", (results) => {
    // console.log(results)
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
    container.append("<span class='noResults'>nothing to show</span>")
  }
}
