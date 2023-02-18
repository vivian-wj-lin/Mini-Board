// const { Outposts } = require("aws-sdk")

console.log("common.js is running")
const fileReader = new FileReader()
const fileInput = document.querySelector('input[type="file"]')

//hide images that has falsy srcs

//img preview
function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader()

    reader.onload = function (e) {
      $("#blah").attr("src", e.target.result)
    }

    reader.readAsDataURL(input.files[0])
  }
}

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
  let fileInput = document.querySelector("#input-img")

  let data = {
    content: textbox.val(),
  }
  //both text and img msg is submitted
  if (fileInput.files.length > 0) {
    fileReader.readAsDataURL(fileInput.files[0])
    fileReader.onload = () => {
      let imagedata = fileReader.result
      data.imagedata = imagedata //base64

      if (isModal) {
        let id = button.data().id
        if (id == null) return alert("Button id is null")
        data.replyTo = id
      }

      $.post("/api/posts", data, (postData, status, xhr) => {
        if (postData.replyTo) {
          location.reload()
        } else {
          console.log("postData in common.js:", postData)
          let html = createPostHtml(postData)
          $(".postsContainer").prepend(html)
          textbox.val("")
          imgbox.src("")
        }
      })
    }
  } else {
    //only text msg is submitted
    if (isModal) {
      let id = button.data().id
      if (id == null) return alert("Button id is null")
      data.replyTo = id
    }

    $.post("/api/posts", data, (postData, status, xhr) => {
      if (postData.replyTo) {
        location.reload()
      } else {
        console.log("postData in common.js:", postData)
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("")
        imgbox.src("")
        // const PreviewImg = document.getElementById("blah")
        // PreviewImg.src = ""

        // button.prop("disabled", true)
      }
    })
  }
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
  let largeFontClass = largeFont ? "largeFont" : ""

  let replyFlag = ""
  if (postData.replyTo) {
    let replyToUsername = postData.postedBy.username
    replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}<a>
                    </div>`
  }
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
                              <br>
                              <img src=${
                                postData.postedBy["imagedata"]
                              } alt="image" class="postedImg">
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

function outputPostswithReplies(results, container) {
  container.html("")

  let replyPostIds = results.replies.map(function (reply) {
    return reply.postedBy.posts_Id
  })

  console.log(results)
  console.log(replyPostIds)

  let replyPost = results.replies.map(function (reply) {
    return reply
  })

  //preparation before getting replies of the replies
  let AllpostsIdsfromPostData = results.postData.map(
    (post) => post.postedBy.posts_Id
  )

  let AllpostsfromPostData = results.postData.map((post) => post)

  let replyToValues = AllpostsfromPostData.map((post) => post.replyTo)

  //find overlapped values
  let overlappingValues = replyPostIds.filter((value) =>
    replyToValues.includes(value)
  )

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