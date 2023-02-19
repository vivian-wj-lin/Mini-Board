const fileReader = new FileReader()
const fileInput = document.querySelector('input[type="file"]')

// hide img which src is empty //then the img preview won't work
// $(document).ready(function () {
//   $("img")
//     .filter(function () {
//       return !this.getAttribute("src")
//     })
//     .css("display", "none")
// })

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

//hide the img element if user didn't upload img file //doesn't work
// let imgbox = $("#blah")
// imgbox.onload = function () {
//   if (img.src) {
//     img.style.display = "block"
//   } else {
//     img.style.display = "none"
//   }
// }

$("#postTextarea,#replyTextarea").keyup((event) => {
  let textbox = $(event.target)
  let value = textbox.val().trim()
  // console.log("value:",value)

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
  let imgbox = $("#blah")
  let fileInput = document.querySelector("#input-img")

  let data = {
    content: textbox.val(),
  }

  if (isModal) {
    let id = button.data().id
    if (id == null) return alert("Button id is null")
    data.replyTo = id
  }

  //both text and img msg are submitted
  if (fileInput.files.length > 0) {
    fileReader.readAsDataURL(fileInput.files[0])
    fileReader.onload = () => {
      let imagedata = fileReader.result
      data.imagedata = imagedata //base64

      console.log("data in comman.js, the FE:", data) //both txt and img

      $.post("/api/posts", data, (postData, status, xhr) => {
        // console.log("postData from FE:", postData)
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("") //clear the textbox after it is posted
        imgbox.src = ""
        fileInput.setAttribute("src", "")
        button.prop("disabled", true)
      })
    }
    console.log("data in comman.js, the FE:", data)
  } else {
    //only text msg is submitted
    $.post("/api/posts", data, (postData, status, xhr) => {
      // console.log("postData in commona.js line26:", postData)
      if (postData.replyTo) {
        location.reload()
      } else {
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("") //clear the textbox after it is posted
        imgbox.src = ""
        fileInput.setAttribute("src", "")
        button.prop("disabled", true)
      }
    })
  }
})

$("#replyModal").on("show.bs.modal", (event) => {
  var button = $(event.relatedTarget)
  var postId = getPostIdFromElement(button)
  $("#submitReplyButton").data("id", postId)

  $.get("/api/posts/" + postId, (results) => {
    // console.log("the original post info once the reply is hit:", results)
    outputPosts(results, $("#originalPostContainer"))
  })
})

$("#replyModal").on("hidden.bs.modal", (event) => {
  $("#originalPostContainer").html("")
})

$(document).on("click", ".likeButton", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  // console.log(postId)
  if (postId === undefined) return

  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      // console.log(
      //   "postData.likes.length in common js line 93:",
      //   postData.likes.length
      // )
      button.find("span").text(postData.likes.length || "")
    },
  })
})

$(document).on("click", ".retweetButton", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  // console.log(postId)
  if (postId === undefined) return

  $.ajax({
    url: `/api/posts/${postId}/retweet`,
    type: "POST",
    success: (postData) => {
      // console.log("postData(retweet) in common.js line 125 :", postData)

      button.find("span").text(postData.retweetUsers.length || "")

      setTimeout(() => {
        window.location.href = "/"
      }, 500)
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
  if (postData == null) return alert("post object is null")

  let isRetweet = postData.retweetData !== undefined
  let retweetedBy = isRetweet ? postData.postedBy.username : null
  postData = isRetweet ? postData.retweetData : postData

  console.log("isRetweet:", isRetweet)

  let postedBy = postData.postedBy

  if (postedBy._id === undefined) {
    return console.log("User object not populated")
  }

  let displayName = postedBy.username
  let timestamp = timeDifference(new Date(), new Date(postData.createdAt))

  let retweetText = ""
  if (isRetweet) {
    retweetText = `<span>
                        <i class='fas fa-retweet'></i>
                        Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>    
                    </span>`
  }

  let replyFlag = ""
  if (postData.replyTo) {
    if (!postData.replyTo._id) {
      return alert("Reply to is not populated")
    } else if (!postData.replyTo.postedBy._id) {
      return alert("Posted by is not populated")
    }

    var replyToUsername = postData.replyTo.postedBy.username
    replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}<a>
                    </div>`
  }

  return `<div class='post' data-id="${postData._id}">
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class='header'>
                            <a href='/profile/${
                              postedBy.username
                            }'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                            <br>
                              <img src=${
                                postData.imageUrl
                              } alt="image" class="postedImg">
                        </div>
                        <div class='postFooter'>
                        <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class='far fa-comment'></i>
                                </button>
                            </div>
                            <div class='postButtonContainer'>
                                <button class='retweetButton'>
                                    <i class='fas fa-retweet'></i>
                                    <span>${
                                      postData.retweetUsers.length || ""
                                    }</span>
                                </button>
                            </div>
                            <div class='postButtonContainer'>
                                <button class="likeButton">
                                    <i class='far fa-heart'></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
}

function timeDifference(current, previous) {
  var msPerMinute = 60 * 1000
  var msPerHour = msPerMinute * 60
  var msPerDay = msPerHour * 24
  var msPerMonth = msPerDay * 30
  var msPerYear = msPerDay * 365

  var elapsed = current - previous

  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return "Just now"

    return Math.round(elapsed / 1000) + " seconds ago"
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " minutes ago"
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago"
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago"
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago"
  } else {
    return Math.round(elapsed / msPerYear) + " years ago"
  }
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
    container.append("<span class='noResults'>Nothing to show.</span>")
  }
}
