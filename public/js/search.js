let timer

$("#searchBox").keydown((event) => {
  clearTimeout(timer)
  let textbox = $(event.target)
  let value = textbox.val()
  let searchType = textbox.data().search

  timer = setTimeout(() => {
    value = textbox.val().trim()

    if (value == "") {
      $(".resultsContainer").html("")
    } else {
      //   console.log(value)
      search(value, searchType)
    }
  }, 1000)
})

function search(searchTerm, searchType) {
  let url = searchType == "users" ? "/api/users" : "/api/posts"

  $.get(url, { search: searchTerm }, (results) => {
    // console.log(results)
    if (searchType == "users") {
      //   console.log(results)
      outputUsers(results, $(".resultsContainer"))
    } else {
      outputPosts(results, $(".resultsContainer"))
    }
  })
}
