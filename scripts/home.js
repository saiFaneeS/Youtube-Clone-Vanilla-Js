const apiKey = "AIzaSyAgWPzUmlxVjTw2xsXu_bDmkULd6Za3zFQ";

const categoryString = window.location.search;
const categoryParams = new URLSearchParams(categoryString);
let category = categoryParams.get("category");

// Set filter title for Sidebar filters
let filterTitle;

if ((category && category.toLowerCase().trim() === "home") || !category) {
  filterTitle = "";
} else {
  filterTitle = `Showing Results for "${
    category.charAt(0).toUpperCase() + category.slice(1)
  }"`;
}

document.querySelector(".filter-title").innerText = filterTitle;

const loader = document.querySelector(".loader");
let isLoading = false;

// Recommended Views
const fetchRecommendedVideos = async () => {
  let apiUrl;

  if (category) {
    apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${category}&videoDuration=long&maxResults=12`;
  } else {
    apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=12&videoDuration=long`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const videoItems = data.items || [];

    if (videoItems.length > 0) {
      const recommendedVideos = await Promise.all(
        videoItems.map(async (video) => {
          const videoId = video.id.videoId;

          // Fetch video statistics
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoId}`;
          const statsResponse = await fetch(statsUrl);
          const statsData = await statsResponse.json();

          // Fetch channel details for the specific video
          const channelId = video.snippet.channelId;
          const channelsApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
          const channelsResponse = await fetch(channelsApiUrl);
          const channelsData = await channelsResponse.json();
          const channelSnippet = channelsData.items[0]?.snippet;

          const stats = statsData.items[0]?.statistics;
          return {
            ...video,
            views: stats?.viewCount || 0,
            channel: {
              channelId: channelSnippet?.channelId || "",
              channelTitle: channelSnippet?.title || "",
              channelThumbnail: channelSnippet?.thumbnails?.default.url || "",
            },
          };
        })
      );

      renderRecommendedVideos(recommendedVideos);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const recommendedSection = document.querySelector(".recommended");
let recommendedVideos = [];
const renderRecommendedVideos = (moreVideos) => {
  recommendedVideos = [...recommendedVideos, ...moreVideos];
  recommendedSection.innerHTML = "";
  recommendedVideos.forEach((video) => {
    recommendedVideos.forEach((video) => {
      const videoCard = document.createElement("a");
      videoCard.classList.add("video");
      videoCard.addEventListener("click", () => setVideoId(video.id.videoId));
      videoCard.innerHTML = `
      <div class="thumbnail-container">
        <img src=${video.snippet.thumbnails.high.url} alt="..." />
      </div>
      <div class="video-details">
        <div class="channel-logo-container">
          <img src=${video.channel.channelThumbnail} alt="..." />
        </div>
        <div class="text-info">
          <h3 class="video-title">${video?.snippet.title.slice(0, 55)} ${
        video?.snippet.title.length > 55 ? "..." : ""
      }</h3>
          <div>
            <div class="channel-name">${video.snippet.channelTitle}</div>
            <span class="video-views">${formatViews(video.views)} views</span>
            <span class="uploaded-timeago">${formatRelativeTime(
              video.snippet.publishedAt
            )}</span>
          </div>
        </div>
      </div>
    `;
      recommendedSection.appendChild(videoCard);
    });
  });
};

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

const setVideoId = (videoId) => {
  window.location.href = `./watch.html?id=${encodeURIComponent(videoId)}`;
};

let nextPageToken = "";

const fetchMoreVideos = async () => {
  let apiUrlLong;

  if (category) {
    apiUrlLong = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${category}&videoDuration=long&maxResults=12&pageToken=${nextPageToken}`;
  } else {
    apiUrlLong = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=12&videoDuration=long&pageToken=${nextPageToken}`;
  }

  try {
    const response = await fetch(apiUrlLong);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoItems = data.items;
      nextPageToken = data.nextPageToken || "";

      const moreVideos = await Promise.all(
        videoItems.map(async (video) => {
          const videoId = video.id.videoId;

          // Fetch video statistics
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoId}`;
          const statsResponse = await fetch(statsUrl);
          const statsData = await statsResponse.json();

          const channelId = video.snippet.channelId;
          const channelsApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
          const channelsResponse = await fetch(channelsApiUrl);
          const channelsData = await channelsResponse.json();
          const channelSnippet = channelsData.items[0]?.snippet;

          const stats = statsData.items[0]?.statistics;
          return {
            ...video,
            views: stats?.viewCount || 0,
            channel: {
              channelId: channelSnippet?.channelId || "",
              channelTitle: channelSnippet?.title || "",
              channelThumbnail: channelSnippet?.thumbnails?.default.url || "",
            },
          };
        })
      );

      renderRecommendedVideos(moreVideos);
    }
  } catch (error) {
    console.error("Error fetching more data:", error);
  }
};

window.addEventListener("scroll", () => {
  if (
    !isLoading &&
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
  ) {
    loader.style.display = "block";
    isLoading = true;
    fetchMoreVideos().finally(() => {
      loader.style.display = "none";
      isLoading = false;
    });
  }
});

window.addEventListener("DOMContentLoaded", () => {
  fetchRecommendedVideos();
});

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
