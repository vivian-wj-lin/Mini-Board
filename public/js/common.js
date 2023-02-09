// const { Outposts } = require("aws-sdk")

console.log("common.js is running")

$("#postTextarea, #replyTextarea").keyup((event) => {
  let textbox = $(event.target)
  let value = textbox.val().trim()
  // console.log(value)

  let isModal = textbox.parents(".modal").length == 1

  let submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton")

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

$("#replyModal").on("show.bs.modal", (event) => {
  var button = $(event.relatedTarget)
  var postId = getPostIdFromElement(button)

  $.get("/api/posts/" + postId, (results) => {
    console.log("i am the result:", results)
    outputPosts(results, $("#originalPostContainer"))
  })
})

// $.ajax({
//   url: "/api/like-count",
//   type: "GET",
//   success: (likeCounts) => {
//     likeCounts.forEach((likeCount) => {
//       let postId = likeCount.post_id
//       let count = likeCount.likeCount
//       console.log("postId:", postId)
//       console.log("count:", count)
//       let selectedElements = $(`[data-id=${postId}] .likeButton span`)
//       // let selectedElements = $(`[data-id=${postId}] span`)

//       console.log("selectedElements:", selectedElements)
//       selectedElements.text(count)
//     })
//     console.log("likeCounts:", likeCounts)
//   },
//   error: (error) => {
//     console.error("Error retrieving like counts:", error)
//   },
// })

async function getLikeCounts() {
  try {
    let response = await $.ajax({
      url: "/api/like-count",
      type: "GET",
    })
    response.forEach((likeCount) => {
      let postId = likeCount.post_id
      let count = likeCount.likeCount
      // console.log("postId:", postId)
      // console.log("count:", count)
      let selectedElements = $(`[data-id=${postId}] .likeButton span`)
      // console.log("selectedElements:", selectedElements)
      selectedElements.text(count)
    })
    // console.log("likeCounts:", response)
  } catch (error) {
    console.error("Error retrieving like counts:", error)
  }
}
getLikeCounts()

$(document).on("click", ".likeButton, .likeButton i.fa-heart", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  console.log("postId:", postId)
  if (postId === undefined) return

  $.ajax({
    url: "/api/likes",
    type: "GET",
    data: { postId: postId, userId: window.userId },
    success: (likesData) => {
      console.log("likesData:", likesData)
      let likeExists = likesData.some(
        (like) => like.postId === postId && like.userId === window.userId
      )
      if (likeExists) {
        // User has liked the post, perform DELETE
        $.ajax({
          url: "/api/likes",
          type: "DELETE",
          data: { postId: postId, userId: window.userId },
          success: (postData) => {
            console.log("Post unliked successfully:", postData)
            // Update the UI with the new like count
            getLikeCounts()
          },
          error: (error) => {
            console.error("Error unliking post:", error)
          },
        })
      } else {
        // User has not liked the post, perform INSERT
        $.ajax({
          url: "/api/likes",
          type: "POST",
          data: { postId: postId, userId: window.userId },
          success: (postData) => {
            console.log("Post liked successfully:", postData)
            // Update the UI with the new like count
          },
          error: (error) => {
            console.error("Error liking post:", error)
          },
        })
      }
    },
    error: (error) => {
      console.error("Error checking if like exists:", error)
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
  getLikeCounts()
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
                                  <button data-toggle='modal' data-target='#replyModal'>
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
                                      <span></span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>`
}

function outputPosts(results, container) {
  container.html("")

  if (!Array.isArray(results)) {
    results = [results]
  }

  results.forEach((result) => {
    let html = createPostHtml(result)
    container.append(html)
  })
  if (results.length == 0) {
    container.append("<span class='noResults'>nothing to show</span>")
  }
}

// $("#testclass").click((event) => {
//   $("#image-input").click()
//   console.log($("#image-input").value)
// })

// $("#testclass").click((event) => {
//   $("#input-img").click()
//   console.log($("#input-img").value)
// })
