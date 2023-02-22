$(document).ready(() => {
  if (selectedTab === "followers") {
    loadFollowers()
  } else {
    loadFollowing()
  }
})

function loadFollowers() {
  $.get(`/api/users/${profileUserId}/followers`, (results) => {
    outputUsers(results.followers, $(".resultsContainer"))
  })
}

function loadFollowing() {
  $.get(`/api/users/${profileUserId}/following`, (results) => {
    outputUsers(results.following, $(".resultsContainer"))
  })
}

function outputUsers(results, container) {
  // console.log("outputUsers data:", data)
  container.html("")
  results.forEach((result) => {
    // console.log(result.username)
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
