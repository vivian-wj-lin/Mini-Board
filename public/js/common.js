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
    console.log(postData)
  })
})

// $("#testclass").click((event) => {
//   $("#image-input").click()
//   console.log($("#image-input").value)
// })

// $("#testclass").click((event) => {
//   $("#input-img").click()
//   console.log($("#input-img").value)
// })
