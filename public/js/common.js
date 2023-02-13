// const { Outposts } = require("aws-sdk")

console.log("common.js is running")
const fileReader = new FileReader()
const fileInput = document.querySelector('input[type="file"]')

const submitBtn = document.querySelector("#submitPostButton")
submitBtn.addEventListener("click", (e) => {
  e.preventDefault()
  console.log(fileInput)
  console.log(fileReader.readAsDataURL(fileInput.files))
  fileReader.readAsDataURL(fileInput.files[0])
  fileReader.onload = () => {
    let imagedata = fileReader.result
    let data = {
      imagedata: imagedata, //base64
      textinput: textInput.value,
    }
    console.log(data)
    // send data to backend
    console.log(imagedata) //base64
    fetch("/upload", {
      method: "post",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    })
      // .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          createContents(textInput.value, imagedata)
        }
        return res.json()
      })
      .then((data) => {
        console.log(data)
      })
      .catch((error) => console.error("Error:", error))
  }
})

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

$("#submitPostButton,#submitReplyButton").click((event) => {
  let button = $(event.target)
  let isModal = button.parents(".modal").length == 1
  let textbox = isModal ? $("#replyTextarea") : $("#postTextarea")

  let data = {
    content: textbox.val(),
  }

  if (isModal) {
    let id = button.data().id
    if (id == null) return alert("Button id is null")
    data.replyTo = id
  }

  $.post("/api/posts", data, (postData, status, xhr) => {
    if (postData.replyTo) {
      location.reload()
    } else {
      // console.log("postData:", postData)
      let html = createPostHtml(postData)
      $(".postsContainer").prepend(html)
      textbox.val("")
      // button.prop("disabled", true)
    }
  })
})

$("#replyModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#submitReplyButton").data("id", postId)
  console.log("this is the original postid:", $("#submitReplyButton").data().id)

  $.get("/api/posts/" + postId, (results) => {
    console.log("i am the result:", results)
    outputPosts(results.filteredpostData, $("#originalPostContainer"))
  })
})

$("#replyModal").on("hidden.bs.modal", () =>
  $("#originalPostContainer").html("")
)

$("#deletePostModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#deletePostButton").data("id", postId)
  // console.log(
  //   "id of the post u want to delete:",
  //   $("#deletePostButton").data().id
  // )
})

$("#deletePostButton").click((event) => {
  let postId = $(event.target).data("id")

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "DELETE",
    success: () => {
      location.reload()
    },
    error: (error) => {
      console.error("Error deleting post:", error)
    },
  })
})

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

// $(document).on("click", ".likeButton, .likeButton i.fa-heart", (event) => {
$(document).on("click", ".likeButton", (event) => {
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

$(document).on("click", ".post", (event) => {
  let element = $(event.target)
  let postId = getPostIdFromElement(element)

  if (postId !== undefined && !element.is("button")) {
    window.location.href = "/posts/" + postId
  }
})

function getPostIdFromElement(element) {
  let isRoot = element.hasClass("post")
  let rootElement = isRoot == true ? element : element.closest(".post")
  let postId = rootElement.data().id

  if (postId === undefined) return alert("Post id undefined")

  return postId
}

function createPostHtml(postData, largeFont = false) {
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
  let largeFontClass = largeFont ? "largeFont" : ""

  let replyFlag = ""
  if (postData.replyTo) {
    // console.log("this is postData.replyTo:", postData.replyTo)
    // console.log("filteredpostData:", filteredpostData)
    // console.log("postData:", postData)
    let replyToUsername = postData.postedBy.username
    replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}<a>
                    </div>`
  }
  // console.log("postData in common.js:", postData)
  let buttons = ""
  if (postData.postedBy.user_id == window.userId) {
    buttons = `<button data-id="${postedBy["posts_Id"]}" data-toggle="modal" data-target="#deletePostModal"><i class='fas fa-times'></i></button>`
  }

  return `<div class='post ${largeFontClass}' data-id='${postedBy["posts_Id"]}'>

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
                            ${buttons}
                          </div>
                          ${replyFlag}
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

function outputPostswithReplies(results, container) {
  container.html("")

  // console.log("postData:", postData)
  // console.log("results.replyTo:", results.replyTo)
  // console.log("results:", results)
  // console.log("results.replies.replyTo:", results.replies.replyTo)

  let replyPostIds = results.replies.map(function (reply) {
    return reply.postedBy.posts_Id
  })

  console.log(results)
  console.log(replyPostIds)

  let replyPost = results.replies.map(function (reply) {
    return reply
  })

  // console.log("replyPost:", replyPost)
  // console.log("results.filteredpostData:", results.filteredpostData)
  // console.log("results.replies:", results.replies)

  //preparation before getting replies of the replies
  let AllpostsIdsfromPostData = results.postData.map(
    (post) => post.postedBy.posts_Id
  )
  // console.log(AllpostsIdsfromPostData)

  let AllpostsfromPostData = results.postData.map((post) => post)
  // console.log("AllpostsfromPostData:", AllpostsfromPostData)

  let replyToValues = AllpostsfromPostData.map((post) => post.replyTo)
  // console.log("replyToValues:", replyToValues)

  //find overlapped values
  let overlappingValues = replyPostIds.filter((value) =>
    replyToValues.includes(value)
  )

  // console.log("overlappingValues:", overlappingValues[0])
  let filteredArray = AllpostsfromPostData.filter(function (post) {
    return post.replyTo === overlappingValues[0]
  })

  console.log("filteredArray:", filteredArray)

  //the main post
  let mainPostHtml = createPostHtml(results.filteredpostData, true)
  container.append(mainPostHtml)

  //replies
  results.replies.forEach((result) => {
    let html = createPostHtml(result)
    container.append(html)
  })

  //replies of the replies
  if (filteredArray) {
    filteredArray.forEach((result) => {
      let html = createPostHtml(result)
      container.append(html)
    })
  }
}
