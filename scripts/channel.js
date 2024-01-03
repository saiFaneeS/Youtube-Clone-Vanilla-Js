const apiKey = "AIzaSyAgWPzUmlxVjTw2xsXu_bDmkULd6Za3zFQ";

const channelId = new URLSearchParams(window.location.search).get("id");

// Fetch Channel Information
async function fetchChannelInformation(channelId) {
  try {
    const channelDetails = await fetchChannelDetails(channelId);
    const channelVideos = await fetchChannelVideos(channelId);

    const channelImage = channelDetails.snippet.thumbnails.high.url;

    return {
      channelId,
      channelImage,
      channelName: channelDetails.snippet.title,
      username: channelDetails.snippet.customUrl || "No custom URL",
      subscribers: formatSubscribers(channelDetails.statistics.subscriberCount),
      numVideos: channelDetails.statistics.videoCount,
      description:
        channelDetails.snippet.description || "No description available",
      channelVideos,
    };
  } catch (error) {
    console.error("Error fetching channel information:", error);
    throw error;
  }
}

// Fetch Channel Details
async function fetchChannelDetails(channelId) {
  const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,brandingSettings,statistics`;
  const channelRes = await fetch(channelApiUrl);
  const channelData = await channelRes.json();

  if (channelData.items && channelData.items.length > 0) {
    return channelData.items[0];
  } else {
    throw new Error("Channel details not found");
  }
}

// Fetch Channel Videos
async function fetchChannelVideos(channelId) {
  const videosApiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=&channelId=${channelId}&videoDuration=long&order=viewCount&maxResults=8`;
  const videosRes = await fetch(videosApiUrl);
  const videosData = await videosRes.json();

  if (videosData.items && videosData.items.length > 0) {
    const videoIds = videosData.items.map((video) => video.id.videoId);
    const videosDetails = await fetchVideosDetails(videoIds);
    return videosDetails;
  } else {
    return [];
  }
}

// Fetch Videos Details
async function fetchVideosDetails(videoIds) {
  const videosDetailsApiUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(
    ","
  )}&part=snippet,statistics`;
  const videosDetailsRes = await fetch(videosDetailsApiUrl);
  const videosDetailsData = await videosDetailsRes.json();

  return videosDetailsData.items.map((video) => ({
    videoId: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url,
    views: formatViews(video.statistics.viewCount),
    publishedAt: formatRelativeTime(video.snippet.publishedAt),
  }));
}

// Format Views
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

// Format Subscribers
function formatSubscribers(subscriberCount) {
  const count = parseInt(subscriberCount, 10);
  if (!isNaN(count)) {
    if (count >= 1e6) {
      return (count / 1e6).toFixed(1) + "M";
    } else if (count >= 1e3) {
      return (count / 1e3).toFixed(1) + "K";
    } else {
      return count;
    }
  } else {
    return subscriberCount;
  }
}

// Format Time
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

fetchChannelInformation(channelId)
  .then((channelInfo) => {
    console.log("Channel Information:", channelInfo);
    renderChannelDetails(channelInfo);
    renderVideos(channelInfo);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const channelContainer = document.querySelector(".searched-channels ");

const renderChannelDetails = (channelInfo) => {
  const channel = document.createElement("div");
  channel.classList.add("searched-channel");

  channel.innerHTML = `
    <div class="channel-col1">
      <div class="channel-logo">
        <img src=${channelInfo.channelImage} alt=""></img>
      </div>
    </div>
    <div class="channel-details">
      <p class="channel-name">${channelInfo.channelName}</p>
      <span class="channel-username">${channelInfo.username}</span>
      <span class="channel-subscribers">${
        channelInfo.subscribers
      } subscribers</span>
      <span class="channel-subscribers">${channelInfo.numVideos} videos</span>
      <p class="channel-description">${
        channelInfo.description.length > 120
          ? channelInfo.description.slice(0, 120) + "..."
          : channelInfo.description
      }</p>
    </div>
  `;

  channelContainer.innerHTML = "";
  channelContainer.appendChild(channel);
};

const videosSection = document.querySelector(".recommended");

const renderVideos = (channelInfo) => {
  videosSection.innerHTML = "";
  channelInfo.channelVideos.forEach((video) => {
    const videoCard = document.createElement("a");
    videoCard.classList.add("video");
    videoCard.addEventListener("click", () => setVideoId(video.videoId));
    videoCard.innerHTML = `
      <div class="thumbnail-container">
        <img src=${video.thumbnail} alt="..." />
      </div>
      <div class="video-details">
        <div class="text-info">
          <h3 class="video-title">${video?.title.slice(0, 55)} ${
      video?.title.length > 55 ? "..." : ""
    }</h3>
          <div>
            <span class="video-views">${video.views} views</span>
            <span class="uploaded-timeago">${video.publishedAt}</span>
          </div>
        </div>
      </div>
    `;
    videosSection.appendChild(videoCard);
  });
};

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

const setVideoId = (videoId) => {
  window.location.href = `./watch.html?id=${encodeURIComponent(videoId)}`;
};
