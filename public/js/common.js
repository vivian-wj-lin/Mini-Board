const fileReader = new FileReader()
const fileInput = document.querySelector('input[type="file"]')
let cropper
let timer
let selectedUsers = []

$(document).ready(() => {
  refreshMessagesBadge()
  refreshNotificationsBadge()
})

//img preview
function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader()

    reader.onload = function (e) {
      $("#blah").attr("src", e.target.result)
      $("#blah").addClass("active")
    }

    reader.readAsDataURL(input.files[0])
  }
}

$("#postTextarea,#replyTextarea").keyup((event) => {
  let textbox = $(event.target)
  let value = textbox.val().trim()
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

  // if (isModal) {
  //   let id = button.data().id
  //   if (id == null) return alert("Button id is null")
  //   data.replyTo = id
  // }

  //both text and img msg are submitted
  if (fileInput.files.length > 0) {
    fileReader.readAsDataURL(fileInput.files[0])
    fileReader.onload = () => {
      let imagedata = fileReader.result
      data.imagedata = imagedata //base64

      console.log("data in comman.js, the FE:", data) //both txt and img

      $.post("/api/posts", data, (postData, status, xhr) => {
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("") //clear the textbox after it is posted
        imgbox.src = ""
        fileInput.setAttribute("src", "")
        button.prop("disabled", true)
        $("#blah").removeClass("active")
        $("#blah").attr("src", "")
        fileInput.value = ""
      })
    }
    console.log("data in comman.js, the FE:", data)
  } else {
    //only text msg is submitted
    if (isModal) {
      let id = button.data().id
      if (id == null) return alert("Button id is null")
      data.replyTo = id

      $("#blah").removeClass("active")
      $("#blah").attr("src", "")
      fileInput.value = ""
    }

    $.post("/api/posts", data, (postData, status, xhr) => {
      if (postData.replyTo) {
        emitNotification(postData.replyTo.postedBy)
        $("#blah").removeClass("active")
        $("#blah").attr("src", "")
        fileInput.value = ""

        location.reload()
      } else {
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("") //clear the textbox after it is posted
        imgbox.src = ""
        fileInput.setAttribute("src", "")
        button.prop("disabled", true)
        $("#blah").removeClass("active")
        $("#blah").attr("src", "")
        fileInput.value = ""
      }
    })
  }
})

$("#replyModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#submitReplyButton").data("id", postId)

  $.get("/api/posts/" + postId, (results) => {
    console.log("the original post info once the reply is hit:", results)
    outputPosts(results.postData, $("#originalPostContainer"))
    console.log("outputPosts:", results.postData)
  })
})

$("#replyModal").on("hidden.bs.modal", (event) => {
  $("#originalPostContainer").html("")
})

$("#deletePostModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#deletePostButton").data("id", postId)
})

$("#confirmPinModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#pinPostButton").data("id", postId)
})

$("#unpinModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget)
  let postId = getPostIdFromElement(button)
  $("#unpinPostButton").data("id", postId)
})

$("#deletePostButton").click((event) => {
  let postId = $(event.target).data("id")

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "DELETE",
    success: (data, status, xhr) => {
      if (xhr.status != 202) {
        alert("無法刪除")
        return
      }
      location.reload()
    },
  })
})

$("#pinPostButton").click((event) => {
  let postId = $(event.target).data("id")

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: true },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert("無法置頂")
        return
      }
      location.reload()
    },
  })
})

$("#unpinPostButton").click((event) => {
  let postId = $(event.target).data("id")

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: false },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert("無法取消置頂")
        return
      }
      location.reload()
    },
  })
})

$("#filePhoto").change(function () {
  if (this.files && this.files[0]) {
    fileReader.onload = (e) => {
      let image = document.getElementById("imagePreview")
      image.src = e.target.result

      if (cropper !== undefined) {
        cropper.destroy()
      }

      cropper = new Cropper(image, {
        aspectRatio: 1 / 1,
        background: false,
      })
    }
    fileReader.readAsDataURL(this.files[0])
  } else {
    console.log("no img")
  }
})

$("#coverPhoto").change(function () {
  if (this.files && this.files[0]) {
    fileReader.onload = (e) => {
      let image = document.getElementById("coverPreview")
      image.src = e.target.result

      if (cropper !== undefined) {
        cropper.destroy()
      }

      cropper = new Cropper(image, {
        aspectRatio: 16 / 9,
        background: false,
      })
    }
    fileReader.readAsDataURL(this.files[0])
  }
})

$("#imageUploadButton").click(() => {
  let canvas = cropper.getCroppedCanvas()
  if (canvas == null) {
    alert("無法上傳照片，請確認檔案格式")
    return
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      console.log("Error: Empty blob.")
      return
    }

    let formData = new FormData()
    formData.append("croppedImage", blob)
    formData.forEach(function (value, key) {
      console.log(key + ": " + value)
    })
    console.log("formData:", formData)
    $.ajax({
      url: "/api/users/profilePicture",
      type: "POST",
      data: formData,
      processData: false, //prevent jQuery from converting data to string
      contentType: false,
      enctype: "multipart/form-data",
      success: () => {
        location.reload()
      },
      error: (xhr, status, error) => {
        console.log(xhr, status, error)
      },
    })
  })
})

$("#coverPhotoButton").click(() => {
  let canvas = cropper.getCroppedCanvas()
  if (canvas == null) {
    alert("無法上傳照片，請確認檔案格式")
    return
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      console.log("Error: Empty blob.")
      return
    }

    let formData = new FormData()
    formData.append("croppedImage", blob)
    formData.forEach(function (value, key) {
      console.log(key + ": " + value)
    })
    console.log("formData:", formData)
    $.ajax({
      url: "/api/users/coverPhoto",
      type: "POST",
      data: formData,
      processData: false, //prevent jQuery from converting data to string
      contentType: false,
      enctype: "multipart/form-data",
      success: () => {
        location.reload()
      },
      error: (xhr, status, error) => {
        console.log(xhr, status, error)
      },
    })
  })
})

$("#userSearchTextbox").keydown((event) => {
  clearTimeout(timer)
  let textbox = $(event.target)
  let value = textbox.val()

  if (value == "" && (event.which == 8 || event.keyCode == 8)) {
    //remove user from selection
    selectedUsers.pop()
    updateSelectedUsersHtml()
    $(".resultsContainer").html("")

    if (selectedUsers.length == 0) {
      $("#createChatButton").prop("disabled", true)
    }
    return
  }

  timer = setTimeout(() => {
    value = textbox.val().trim()

    if (value == "") {
      $(".resultsContainer").html("")
    } else {
      searchUsers(value)
    }
  }, 1000)
})

$("#createChatButton").click(() => {
  var data = JSON.stringify(selectedUsers)

  $.post("/api/chats", { users: data }, (chat) => {
    if (!chat || !chat._id) return alert("Invalid response from server.")

    window.location.href = `/messages/${chat._id}`
  })
})

$(document).on("click", ".likeButton", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  if (postId === undefined) return

  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      button.find("span").text(postData.likes.length || "")

      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass("active")
        emitNotification(postData.postedBy)
      } else {
        button.removeClass("active")
      }
    },
  })
})

$(document).on("click", ".retweetButton", (event) => {
  let button = $(event.target)
  let postId = getPostIdFromElement(button)
  if (postId === undefined) return

  $.ajax({
    url: `/api/posts/${postId}/retweet`,
    type: "POST",
    success: (postData) => {
      button.find("span").text(postData.retweetUsers.length || "")

      if (postData.retweetUsers.includes(userLoggedIn._id)) {
        button.addClass("active")
        emitNotification(postData.postedBy)
      } else {
        button.removeClass("active")
      }

      // setTimeout(() => {
      //   window.location.href = "/"
      // }, 500)
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

$(document).on("click", ".followButton", (event) => {
  let button = $(event.target)
  let userId = button.data().user
  $.ajax({
    url: `/api/users/${userId}/follow`,
    type: "PUT",
    success: (data, status, xhr) => {
      if (xhr.status == 404) {
        alert("user not found")
        return
      }

      let difference = 1

      if (data.following && data.following.includes(userId)) {
        button.addClass("following")
        button.text("Following")
        emitNotification(userId)
      } else {
        button.removeClass("following")
        button.text("Follow")
        difference = -1
      }

      let followersLabel = $("#followersValue")
      if (followersLabel.length != 0) {
        let followersText = followersLabel.text()
        followersText = parseInt(followersText)
        followersLabel.text(followersText + difference)
      }
    },
  })
})

$(document).on("click", ".notification.active", (e) => {
  let container = $(e.target)
  let notificationId = container.data().id

  let href = container.attr("href")
  e.preventDefault()

  let callback = () => (window.location = href)
  markNotificationsAsOpened(notificationId, callback)
})

function getPostIdFromElement(element) {
  let isRoot = element.hasClass("post")
  let rootElement = isRoot == true ? element : element.closest(".post")
  let postId = rootElement.data().id

  if (postId === undefined) return alert("Post id undefined")

  return postId
}

function createPostHtml(postData, largeFont = false) {
  if (postData == null) return alert("post object is null")

  let isRetweet = postData.retweetData !== undefined
  let retweetedBy = isRetweet ? postData.postedBy.accountname : null
  postData = isRetweet ? postData.retweetData : postData

  let postedBy = postData.postedBy

  if (postedBy._id === undefined) {
    return console.log("User object not populated")
  }

  let displayName = postedBy.username
  let timestamp = timeDifference(new Date(), new Date(postData.createdAt))

  let likeButtonActiveClass = postData.likes.includes(userLoggedIn._id)
    ? "active"
    : ""

  let retweetButtonActiveClass = postData.retweetUsers.includes(
    userLoggedIn._id
  )
    ? "active"
    : ""

  let largeFontClass = largeFont ? "largeFont" : ""

  let retweetText = ""
  if (isRetweet) {
    retweetText = `<span>
                        <i class='fas fa-retweet'></i>
                        Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>    
                    </span>`
  }

  let replyFlag = ""
  if (postData.replyTo && postData.replyTo._id) {
    if (!postData.replyTo._id) {
      return alert("ReplyTo is not populated")
    } else if (!postData.replyTo.postedBy._id) {
      return alert("Posted by is not populated")
    }

    let replyToAccountname = postData.replyTo.postedBy.accountname
    replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToAccountname}'>@${replyToAccountname}<a>
                    </div>`
  }

  let buttons = ""
  let pinnedPostText = ""
  if (postData.postedBy._id == userLoggedIn._id) {
    let pinnedClass = ""
    let dataTarget = "#confirmPinModal"
    if (postData.pinned === true) {
      pinnedClass = "active"
      dataTarget = "#unpinModal"
      pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>置頂貼文</span>"
    }

    buttons = ` <button class="pinButton ${pinnedClass}" data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class='fas fa-thumbtack'></i></button>
                <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class='fas fa-times'></i></button>`
  }

  let imgHtml = ""
  if (postData.imageUrl) {
    imgHtml = `<img src="${postData.imageUrl}" alt="image" class="postedImg">`
  } else {
    imgHtml = `<img class="postedImg-hide">`
  }

  return `<div class='post ${largeFontClass}' data-id="${postData._id}">
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class="pinnedPostText">${pinnedPostText}</div>
                        <div class='header'>
                            <a href='/profile/${
                              postedBy.accountname
                            }'>${displayName}</a>
                            <span class='accountname'>@${
                              postedBy.accountname
                            }</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                            <br>
                              ${imgHtml}
                        </div>
                        <div class='postFooter'>
                        <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class='far fa-comment'></i>
                                </button>
                            </div>
                            <div class='postButtonContainer blueGreen'>
                                <button class='retweetButton ${retweetButtonActiveClass}'>
                                    <i class='fas fa-retweet'></i>
                                    <span>${
                                      postData.retweetUsers.length || ""
                                    }</span>
                                </button>
                            </div>
                            <div class='postButtonContainer pink'>
                                <button class="likeButton ${likeButtonActiveClass}">
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

function outputPostsWithReplies(results, container) {
  container.html("")

  //original post to which the main post replied
  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    let html = createPostHtml(results.replyTo)
    container.append(html)
  }

  //main post
  let mainPostHtml = createPostHtml(results.postData, true)
  container.append(mainPostHtml)

  //replies
  results.replies.forEach((result) => {
    let html = createPostHtml(result)
    container.append(html)
  })
}

function outputUsers(results, container) {
  container.html("")
  results.forEach((result) => {
    let html = createUserHtml(result, true)
    container.append(html)
  })
  if (results.length == 0) {
    container.append("<span class='noResults'> 查無結果 </span>")
  }
}

function createUserHtml(userData, showFollowButton) {
  let name = userData.username

  let isFollowing =
    userLoggedIn.following && userLoggedIn.following.includes(userData._id)

  let text = isFollowing ? "Following" : "Follow"
  let buttonClass = isFollowing ? "followButton following" : "followButton"

  let followButton = ""

  if (showFollowButton && userLoggedIn._id != userData._id) {
    followButton = `<div class="followButtonContainer">
                      <button class="${buttonClass}" data-user="${userData._id}">${text}</button>
                    </div>`
  }
  return `<div class="user">
            <div class="userImageContainer">
              <img src="${userData.profilePic}">
            </div>
            <div class="userDetailsContainer">
              <div class="header">
                <a href="/profile/${userData.accountname}">${name}</a>
                <span class="accountname">@${userData.accountname}<span>
              </div>
            </div>
            ${followButton}
          </div>`
}

function searchUsers(searchTerm) {
  $.get("/api/users", { search: searchTerm }, (results) => {
    outputSelectableUsers(results, $(".resultsContainer"))
  })
}

function outputSelectableUsers(results, container) {
  container.html("")

  results.forEach((result) => {
    if (
      //not user himself and not the users that has been selected
      result._id == userLoggedIn._id ||
      selectedUsers.some((u) => {
        return u._id == result._id
      })
    ) {
      return
    }

    let html = createUserHtml(result, false)
    //"false" for not showing the follow button
    let element = $(html)
    element.click(() => {
      userSelected(result)
    })
    container.append(element)
  })

  if (results.length == 0) {
    container.append(
      "<span class='noResults'>No results found 查無使用者</span>"
    )
  }
}

function userSelected(user) {
  selectedUsers.push(user)
  updateSelectedUsersHtml()
  $("#userSearchTextbox").val("").focus()
  $(".resultsContainer").html("")
  $("#createChatButton").prop("disabled", false)
  console.log("selectedUsers:", selectedUsers)
}

function updateSelectedUsersHtml() {
  let elements = []
  selectedUsers.forEach((user) => {
    let name = user.username
    let userElement = $(`<span class='selectedUser'>${name}</span>`)
    elements.push(userElement)
  })

  $(".selectedUser").remove()
  $("#selectedUsers").prepend(elements)
}

function getChatName(chatData) {
  let chatName = chatData.chatName

  if (!chatName) {
    let otherChatUsers = getOtherChatUsers(chatData.users)
    let namesArray = otherChatUsers.map((user) => user.username)
    chatName = namesArray.join(", ")
  }

  return chatName
}

function getOtherChatUsers(users) {
  if (users.length == 1) return users

  return users.filter((user) => user._id != userLoggedIn._id)
}

function messageReceived(newMessage) {
  if ($(".chatContainer").length == 0) {
    //popup notification
  } else {
    addChatMessageHtml(newMessage)
  }
  refreshMessagesBadge()
}

function markNotificationsAsOpened(notificationId = null, callback = null) {
  if (callback == null) callback = () => location.reload()

  console.log("notificationId:", notificationId)

  let url =
    notificationId != null
      ? `/api/notifications/${notificationId}/markAsOpened`
      : `/api/notifications/markAsOpened`
  $.ajax({
    url: url,
    type: "PUT",
    success: () => callback(),
  })
}

function refreshMessagesBadge() {
  $.get("/api/chats", { unreadOnly: true }, (data) => {
    let numResults = data.length

    if (numResults > 0) {
      $("#messagesBadge").text(numResults).addClass("active")
    } else {
      $("#messagesBadge").text("").removeClass("active")
    }
  })
}

function refreshNotificationsBadge() {
  $.get("/api/notifications", { unreadOnly: true }, (data) => {
    let numResults = data.length

    if (numResults > 0) {
      $("#notificationBadge").text(numResults).addClass("active")
    } else {
      $("#notificationBadge").text("").removeClass("active")
    }
  })
}
