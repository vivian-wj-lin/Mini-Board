const fileReader = new FileReader()
const fileInput = document.querySelector('input[type="file"]')

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

$("#postTextarea").keyup((event) => {
  let textbox = $(event.target)
  let value = textbox.val().trim()
  // console.log("value:",value)
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
  let fileInput = document.querySelector("#input-img")

  let data = {
    content: textbox.val(),
  }

  //both text and img msg is submitted
  if (fileInput.files.length > 0) {
    // console.log("fileInput.files[0]:", fileInput.files[0])
    fileReader.readAsDataURL(fileInput.files[0])
    fileReader.onload = () => {
      let imagedata = fileReader.result
      data.imagedata = imagedata //base64

      console.log("data in comman.js, the FE:", data) //both txt and img

      $.post("/api/posts", data, (postData, status, xhr) => {
        console.log("postData from FE:", postData)
        let html = createPostHtml(postData)
        $(".postsContainer").prepend(html)
        textbox.val("") //clear the textbox after it is posted
        fileInput.setAttribute("src", "")
        button.prop("disabled", true)
      })
    }
    console.log("data in comman.js, the FE:", data)
  } else {
    //only text msg is submitted
    $.post("/api/posts", data, (postData, status, xhr) => {
      console.log("postData in commona.js line26:", postData)
      let html = createPostHtml(postData)
      $(".postsContainer").prepend(html)
      textbox.val("") //clear the textbox after it is posted
      fileInput.setAttribute("src", "")
      button.prop("disabled", true)
    })
  }
})

function createPostHtml(postData) {
  let postedBy = postData.postedBy

  if (postedBy._id === undefined) {
    return console.log("User object not populated")
  }

  let displayName = postedBy.username
  // let timestamp = postData.createdAt
  let timestamp = timeDifference(new Date(), new Date(postData.createdAt))

  return `<div class='post'>

                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class='header'>
                            <a href='/profile/${postedBy.username}'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                        </div>
                        <div class='postBody'>
                            <span>${postData.content}</span>
                            <br>
                              <img src=${postData.imageUrl} alt="image" class="postedImg">
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
                                <button>
                                    <i class='far fa-heart'></i>
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
