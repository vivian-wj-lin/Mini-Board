console.log("common.js is running")

$("#postTextarea").keyup((event) => {
  let textbox = $(event.target)
  let value = textbox.val().trim()
  // console.log(value)
  let submitButton = $("#submitPostButton")

  if (submitButton.length == 0) return alert("No submit button found")

  if (value == "") {
    submitButton.prop("disabled", true)
    return
  }

  submitButton.prop("disabled", false)
})

$("#submitPostButton").click((event) => {
  let button = $(event.target)
  let textbox = $("#postTextarea")

  let data = {
    content: textbox.val(),
  }

  $.post("/api/posts", data, (postData, status, xhr) => {
    // console.log("postData:", postData)
    let html = createPostHtml(postData)
    $(".postsContainer").prepend(html)
    textbox.val("")
    // button.prop("disabled", true)
  })
})

$(document).on("click", ".likeButton", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  console.log("postId:", postId)
  if (postId === undefined) return

  $.ajax({
    url: "/api/likes",
    type: "POST",
    data: { postId: postId, userId: window.userId },
    success: (postData) => {
      console.log("likesData:", postData)
      // Update the UI with the new like count
    },
    error: (error) => {
      console.error("Error liking post:", error)
    },
  })
})

function getPostIdFromElement(element) {
  let isRoot = element.hasClass("post")
  let rootElement = isRoot == true ? element : element.closest(".post")
  let postId = rootElement.data().id

  if (postId === undefined) return alert("Post id undefined")

  return postId
}

function createPostHtml(postData) {
  // return postData.content
  let postedBy = postData.postedBy

  let timestamp = new Date().getTime()
  let date = new Date(timestamp)
  let dateString = date.toLocaleDateString()
  let timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  let splitTime = timeString.split(" ")
  if (splitTime.length > 1) {
    timeString = splitTime[1]
  }
  let formattedDate = dateString.split("/").join("-") + " " + timeString
  // console.log(formattedDate)

  // console.log("postData in common.js:", postData)
  // console.log("postedBy in common.js:", postedBy)

  return `<div class='post' data-id='${postedBy["posts_Id"]}'>

                  <div class='mainContentContainer'>
                      <div class='userImageContainer'>
                          <img src='${postedBy["profilePic"]}'>
                      </div>
                      <div class='postContentContainer'>
                          <div class='header'>
                            <a href="profile/${
                              postedBy["username"]
                            }" class="username">${postedBy["username"]}</a>
                            <span class="date">•${
                              postedBy["timefromFE"] || formattedDate
                            }</span>
                          </div>
                          <div class='postBody'>
                              <span>${postData.content}</span>
                          </div>
                          <div class='postFooter'>
                          <div class='postButtonContainer'>
                                  <button>
                                      <i class='far fa-comment'></i>
                                  </button>
                              </div>
                              <div class='postButtonContainer'>
                                  <button>
                                      <i class='fas fa-retweet'></i>
                                  </button>
                              </div>
                              <div class='postButtonContainer'>
                                  <button class='likeButton'>
                                      <i class='far fa-heart'></i>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>`
}

// $("#testclass").click((event) => {
//   $("#image-input").click()
//   console.log($("#image-input").value)
// })

// $("#testclass").click((event) => {
//   $("#input-img").click()
//   console.log($("#input-img").value)
// })
