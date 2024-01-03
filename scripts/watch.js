const apiKey = "AIzaSyAgWPzUmlxVjTw2xsXu_bDmkULd6Za3zFQ";

const videoId = new URLSearchParams(window.location.search).get("id");
const loader = document.querySelector(".loader");
let isLoading = false;

// Search Redirect
const searchBtn = document.querySelector(".search-btn");
const searchInput = document.querySelector(".search-input");

const handleSearch = () => {
  const searchTerm = document.querySelector(".search-input").value;

  window.location.href = `./searched.html?query=${encodeURIComponent(
    searchTerm
  )}`;
};

searchBtn.addEventListener("click", () => {
  if (searchInput.value.length > 0) {
    handleSearch();
  }
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});

// Fetch Video Data
async function fetchVideoDetails(videoId) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoId}`;
  const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&part=snippet&videoId=${videoId}&maxResults=5`;

  try {
    const [videoResponse, statsResponse, commentsResponse] = await Promise.all([
      fetch(apiUrl),
      fetch(statsUrl),
      fetch(commentsUrl),
    ]);

    const videoData = await videoResponse.json();
    const statsData = await statsResponse.json();
    const commentsData = await commentsResponse.json();

    const stats = statsData.items[0].statistics;

    const video = {
      ...videoData.items[0],
      views: stats.viewCount,
      likes: stats.likeCount,
      commentCount: stats.commentCount,
      comments: await fetchCommentDetails(commentsData.items),
    };

    console.log(video);

    renderVideoDetails(video);
  } catch (error) {
    console.error("Error fetching video details:", error);
  }
}

const commentsSection = document.querySelector(".comments-section");

// Fetch Comment Details
async function fetchCommentDetails(comments) {
  const commentDetails = [];

  for (const comment of comments) {
    const userUrl = `https://www.googleapis.com/youtube/v3channels/?key=${apiKey}&part=snippet&id=${comment.snippet.topLevelComment.snippet.authorChannelId.value}`;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();
    const userSnippet = userData.items[0].snippet;

    const commentDetail = {
      author: comment.snippet.topLevelComment.snippet.authorDisplayName,
      text: comment.snippet.topLevelComment.snippet.textDisplay,
      publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
      userImage: userSnippet.thumbnails.default.url,
    };

    commentDetails.push(commentDetail);
  }

  return commentDetails;
}

fetchVideoDetails(videoId);

// Render Video Information
const renderVideoDetails = (video) => {
  console.log(video);
  const videoDetails = document.querySelector(".video-details");
  videoDetails.innerHTML = "";
  videoDetails.innerHTML += `
    <h2 class="video-title">${video.snippet.title}</h2>
    <div class="video-actions">
      <div class="channel-info">
        <div>
          <!-- <div class="channel-logo-container">
            <img src="Channel Name" alt="Channel" />
          </div> -->
          <div class="channel-text-info">
            <div class="channel-name">${video.snippet.channelTitle}</div>
            <div class="channel-subscribers-count">277K subscribers</div>
          </div>
        </div>
        <button id="subscribe-btn">Subscribe</button>
      </div>
     <div class="video-action-buttons">
            <div class="joined-btns">
                <button id="like-btn"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"
                  focusable="false" style="pointer-events: none; display: block;">
                  <path
                    d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z">
                    </path>
                  </svg><span class="action-btn-text"></span>${formatViews(
                    video.likes
                  )}</button>
                <button id="dislike-btn"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24"
                  width="24" focusable="false" style="pointer-events: none; display: block;">
                  <path
                    d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z">
                  </path>
                  </svg></button>
                </div>
            </div>
      </div>
          `;

  const videoDescription = document.querySelector(".description");
  videoDescription.innerHTML = "";
  videoDescription.innerHTML += `
        <span class="desc-vid-views">${formatViews(video.views)} views
        </span>
        <span class="desc-vid-uploaded">${formatRelativeTime(
          video.snippet.publishedAt
        )}
        </span>
        <p>
           ${video.snippet.description}
        </p>
          `;

  // videoDescription.addEventListener("click", toggleDescription());

  const iframe = document.createElement("iframe");
  iframe.id = "video";
  iframe.width = "640";
  iframe.height = "360";
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.allow =
    "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";

  document.getElementById("video").appendChild(iframe);

  window.YT.ready(function () {
    new window.YT.Player("player", {
      height: "390",
      width: "640",
      videoId: videoId,
    });
  });

  // Comments
  commentsSection.innerHTML = "";
  const commentWindow = document.createElement("div");

  commentWindow.innerHTML = `
    <div class="comments-titlebar">
    <h3>${video.commentCount} Comments</h3>
    <!-- <span id="sort-comments-btn"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24"
              viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block;">
              <path d="M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z"></path>
            </svg>Sort by <ul class="sort-comments-modal">
              <li class="top-comments-btn">Top comments</li>
              <li class="newest-comments-btn">Newest first</li>
            </ul></span> -->
          </div>
          <div class="add-comment">
            <div class="comment-pfp">
            <img
                src="https://yt3.ggpht.com/GLYNEucGNNwTLACOg_PAig0NcKP6uROpvH1fSVPwSz4F1kQl8DVJ_siHncPH7Fqd0Ma08qOA=s48-c-k-c0x00ffffff-no-rj"
                alt="" />
                </div>
                <input type="text" placeholder="Add a comment..." />
          </div>
          `;

  commentsSection.appendChild(commentWindow);

  const sortedComments =
    currentSortingMethod === "top"
      ? sortTopComments(video.comments)
      : sortNewestComments(video.comments);

  sortedComments.map((comment) => {
    const commentBox = document.createElement("div");
    commentBox.classList.add("comment");

    commentBox.innerHTML = `
      <div class="comment-user-img">
      <img src="${comment.userImage}" alt=""/>
      </div>
      <div>
        <span class="comment-author">${comment.author}</span>
        <span class="comment-published-at">${formatRelativeTime(
          comment.publishedAt
        )}</span>
        <p class="comment-content">${comment.text}</p>
        </div>
    `;
    commentsSection.appendChild(commentBox);
  });
};


// Fetch Recommendations
const fetchRecommendedVideos = async () => {
  const apiUrlLong = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=6&videoDuration=long`;

  try {
    const response = await fetch(apiUrlLong);
    const data = await response.json();
    const videoItems = data.items || [];
    const VideoIds = videoItems.map((vid) => vid.id.videoId).join(",");

    if (VideoIds) {
      // stats
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${VideoIds}`;
      const res = await fetch(statsUrl);
      const statsData = await res.json();

      const recommendedVideos = videoItems.map((video, index) => {
        const stats = statsData.items[index].statistics;
        return {
          ...video,
          views: stats.viewCount,
        };
      });

      renderRecommendedVideos(recommendedVideos);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const recommendedSection = document.querySelector(".recommendations-section");

const renderRecommendedVideos = (recommendedVideos) => {
  recommendedSection.innerHTML = "";
  recommendedVideos.forEach((video) => {
    const videoCard = document.createElement("a");
    videoCard.classList.add("video");
    videoCard.addEventListener("click", () => setVideoId(video.id.videoId));
    videoCard.innerHTML = `
          <a class="recommended-video">
          <div class="thumbnail-container">
          <img src=${video.snippet.thumbnails.high.url} alt="..." />
          </div>
          <div class="recommended-video-info">
          <h3 class="recommended-video-title">${video?.snippet.title.slice(
            0,
            55
          )} ${video?.snippet.title.length > 55 ? "..." : ""}</h3>
          <div class="recommended-channel-name">${
            video.snippet.channelTitle
          }</div>
          <span class="recommended-video-views">${formatViews(
            video.views
          )} views</span>
          <span class="recommended-uploaded-timeago">${formatRelativeTime(
            video.snippet.publishedAt
          )}</span>
          </div>
          </a>
    `;
    recommendedSection.appendChild(videoCard);
  });
};

// Fetch More Comments
let nextPageToken = "";

const fetchMoreComments = async () => {
  const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&part=snippet&videoId=${videoId}&maxResults=5&pageToken=${nextPageToken}`;

  try {
    const res = await fetch(commentsUrl);
    const data = await res.json();
    nextPageToken = data.nextPageToken || "";

    if (data.items) {
      const newComment = await fetchCommentDetails(data.items);
      appendCommentsToPage(newComment);
    }
  } catch (error) {
    console.error("Error fetching more comments:", error);
  }
};

const appendCommentsToPage = (newComment) => {
  const commentBox = document.createElement("div");
  commentBox.classList.add("comment");

  commentBox.innerHTML = `
      <div class="comment-user-img">
      <img src="${newComment[0]?.userImage}" alt=""/>
      </div>
      <div>
        <span class="comment-author">${newComment[0]?.author}</span>
        <span class="comment-published-at">${formatRelativeTime(
          newComment[0]?.publishedAt
        )}</span>
        <p class="comment-content">${newComment[0]?.text}</p>
        </div>`;

  commentsSection.appendChild(commentBox);
};

// Toggle Description
const toggleDescription = () => {
  const description = document.querySelector(".description");
  const descriptionText = document.querySelector(".description p");

  const originalDesc = descriptionText.textContent.trim();

  let desc = "open";

  if (desc === "close") {
    description.textContent = originalDesc;
    desc = "open";
  } else {
    const words = originalDesc.split(/\s+/);
    const shortenedText = words.slice(0, 60).join(" ");
    description.textContent = shortenedText + " ...";
    desc = "close";
  }
};

// Formatting Numbers
function formatViews(views) {
  const viewsNumber = parseInt(views, 10);

  if (!isNaN(viewsNumber)) {
    if (viewsNumber >= 1e6) {
      return (viewsNumber / 1e6).toFixed(1) + "M";
    } else if (viewsNumber >= 1e3) {
      return (viewsNumber / 1e3).toFixed(1) + "K";
    } else {
      return viewsNumber;
    }
  } else {
    return views;
  }
}

function formatRelativeTime(timestamp) {
  const currentDate = new Date();
  const date = new Date(timestamp);
  const timeDifferenceInSeconds = Math.floor((currentDate - date) / 1000);
  const units = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(units)) {
    const value = Math.floor(timeDifferenceInSeconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

const setVideoId = (videoId) => {
  window.location.href = `./watch.html?id=${encodeURIComponent(videoId)}`;
};

// Sort Comments Toggle Button
const sortBtn = document.querySelector("#sort-comments-btn");
const sortModal = document.querySelector(".sort-comments-modal");

sortModal.style.display = "none";

sortBtn.addEventListener("click", () => {
  if (sortModal.style.display === "none") {
    sortModal.style.display = "block";
  } else {
    sortModal.style.display = "none";
  }
});

// Sort Comments Functionality
const topCommentsBtn = document.querySelector(".top-comments-btn");
const newestCommentsBtn = document.querySelector(".newest-comments-btn");

let currentSortingMethod = "top";

topCommentsBtn.addEventListener("click", () => {
  currentSortingMethod = "top";
});

newestCommentsBtn.addEventListener("click", () => {
  currentSortingMethod = "new";
});

const sortTopComments = (comments) => {
  return comments.sort((a, b) => {
    return b.likes - a.likes;
  });
};

const sortNewestComments = (comments) => {
  return comments.sort((a, b) => {
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
};

// Unlimited Scroll
const scrollThreshold = 1;

window.addEventListener("scroll", () => {
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollPosition = window.innerHeight + window.scrollY;

  if (scrollPosition >= scrollHeight * scrollThreshold) {
    loader.style.display = "block";
    isLoading = true;

    fetchMoreComments().finally(() => {
      loader.style.display = "none";
      isLoading = false;
    });
  }
});

// Initial Fetch
window.addEventListener("DOMContentLoaded", () => {
  fetchRecommendedVideos();
});
