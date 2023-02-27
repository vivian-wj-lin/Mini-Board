$(document).ready(() => {
  $.get(`/api/chats/${chatId}`, (data) => {
    $("#chatName").text(getChatName(data))
  })
})

$("#chatNameButton").click(() => {
  let name = $("#chatNameTextbox").val().trim()

  $.ajax({
    url: "/api/chats/" + chatId,
    type: "PUT",
    data: { chatName: name },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert("could not update")
      } else {
        location.reload()
      }
    },
  })
})

$(".sendMessageButton").click(() => {
  messageSubmitted()
})

$(".inputTextbox").keydown((event) => {
  if (event.which === 13) {
    messageSubmitted()
    return false //preventing a new line if the enter key is pressed
  }
})

function messageSubmitted() {
  let content = $(".inputTextbox").val().trim()

  if (content != "") {
    sendMessage(content)
    $(".inputTextbox").val("")
  }
}

function sendMessage(content) {
  //   console.log(content)
  $.post(
    "/api/messages",
    { content: content, chatId: chatId },
    (data, status, xhr) => {
      console.log(data)
    }
  )
}
