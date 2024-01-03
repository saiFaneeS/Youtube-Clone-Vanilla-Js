const apiKey = "AIzaSyAgWPzUmlxVjTw2xsXu_bDmkULd6Za3zFQ";

const loader = document.querySelector(".loader");
let isLoading = false;

// Search Redirect
const searchBtn = document.querySelector(".search-btn");
const searchInput = document.querySelector(".search-input");

const queryString = window.location.search;
const searchParams = new URLSearchParams(queryString);
const query = searchParams.get("query");

fetchSearchedVideos(query);
fetchSearchedChannels(query);

document.querySelector(".search-input").value = query;

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

const searchedChannelSection = document.querySelector(".searched-channels");
const searchedVideosSection = document.querySelector(".searched-videos");
let searchedChannels = [];
let searchedVideos = [];

// Fetch Channel
async function fetchSearchedChannels(query) {
  const channelsApiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=channel&part=snippet&q=${query}&maxResults=1`;
  const channelsRes = await fetch(channelsApiUrl);
  const channelsData = await channelsRes.json();
  console.log(channelsData);

  if (channelsData.items && channelsData.items.length > 0) {
    const channelId = channelsData.items[0].id.channelId;
    fetchChannelDetails(channelId);
  }
}

async function fetchChannelDetails(channelId) {
  const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,statistics`;
  const channelRes = await fetch(channelApiUrl);
  const channelData = await channelRes.json();
  console.log(channelData);

  renderSearchedChannel(channelData);
}

const renderSearchedChannel = (channel) => {
  searchedChannelSection.innerHTML = "";

  if (channel.items && channel.items.length > 0) {
    const channelItem = channel.items[0];

    const channelCard = document.createElement("a");
    channelCard.addEventListener("click", () =>
      setChannelId(channel.items[0].id)
    );
    channelCard.classList.add("searched-channel");
    channelCard.innerHTML = `
      <div class="channel-col1">
        <div class="channel-logo">
          <img src=${channelItem.snippet.thumbnails.high.url} alt="..."/>
        </div>
      </div>
        <div class="channel-details">
          <p class="channel-name">${channelItem.snippet.title}</p>
          <span class="channel-username">${
            channelItem.snippet.customUrl || "No custom URL"
          }</span>
          ${
            channelItem.statistics
              ? `<span class="channel-subscribers">${formatSubscribers(
                  channelItem.statistics.subscriberCount
                )} subscribers</span>`
              : ""
          }
          <p class="channel-description">${
            channelItem.snippet.description.length > 150
              ? channelItem.snippet.description.slice(0, 150) + "..."
              : channelItem.snippet.description || "No description available"
          }</p>
        </div>
    `;

    searchedChannelSection.appendChild(channelCard);
  }
};

// Fetch Searched Videos
async function fetchSearchedVideos(query) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${query}&maxResults=8`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const videoItems = data.items || [];

    if (videoItems.length > 0) {
      // Get unique channel ids
      const uniqueChannelIds = Array.from(
        new Set(videoItems.map((vid) => vid.snippet.channelId))
      );

      // Fetch channel details
      const channelsApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${uniqueChannelIds.join(
        ","
      )}&key=${apiKey}`;
      const channelsResponse = await fetch(channelsApiUrl);
      const channelsData = await channelsResponse.json();

      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoItems
        .map((vid) => vid.id.videoId)
        .join(",")}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      const searchedVideos = videoItems.map((video, index) => {
        const stats = statsData.items[index].statistics;
        const channelSnippet = channelsData.items.find(
          (channel) => channel.id === video.snippet.channelId
        )?.snippet;
        return {
          ...video,
          views: stats.viewCount,
          channel: {
            channelId: channelSnippet?.channelId || "",
            channelTitle: channelSnippet?.title || "",
            channelThumbnail: channelSnippet?.thumbnails?.default.url || "",
          },
        };
      });

      renderSearchedVideos(searchedVideos);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

const renderSearchedVideos = (moreVideos) => {
  searchedVideos = [...searchedVideos, ...moreVideos];

  searchedVideosSection.innerHTML = "";
  searchedVideos.forEach((video) => {
    const videoCard = document.createElement("a");
    videoCard.addEventListener("click", () => setVideoId(video.id.videoId));
    videoCard.classList.add("searched-video");
    videoCard.innerHTML = `
    <div class="thumbnail-container">
      <img src=${video.snippet.thumbnails.high.url} alt="..." />
    </div>
    <div class="text-info">
      <h3 class="video-title">${video?.snippet.title.slice(0, 100)} ${
      video?.snippet.title.length > 55 ? "..." : ""
    }</h3>
      <div>
        <span class="video-views">${formatViews(video.views)} views
        </span>
        <span class="uploaded-timeago">${formatRelativeTime(
          video.snippet.publishedAt
        )}</span>
        <div class="channel-info">
          <div class="channel-logo-container">
            <img src=${video?.channel?.channelThumbnail} alt="..." />
          </div>
          <div class="channel-name">${video.snippet.channelTitle}</div>
        </div>
      </div>
    </div>
  `;
    searchedVideosSection.appendChild(videoCard);
  });
};

// Fetch More Videos
let nextPageToken = "";

const fetchMoreVideos = async (query) => {
  if (!nextPageToken) {
    return;
  }

  const apiUrlLong = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${query}&maxResults=1&pageToken=${nextPageToken}`;

  try {
    const response = await fetch(apiUrlLong);
    const data = await response.json();
    const videoItems = data.items || [];
    nextPageToken = data.nextPageToken || "";

    if (videoItems.length > 0) {
      const moreVideos = await Promise.all(
        videoItems.map(async (video) => {
          const videoId = video.id.videoId;

          // Check if the video ID has already been fetched
          if (!fetchedVideoIds.has(videoId)) {
            fetchedVideoIds.add(videoId);

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
          } else {
            return null;
          }
        })
      );

      // Render only non-null values (skipped duplicates)
      renderSearchedVideos(moreVideos.filter((video) => video !== null));
    }
  } catch (error) {
    console.error("Error fetching more data:", error);
  }
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

// Unlimited Scroll
const scrollThreshold = 0.9;

window.addEventListener("scroll", () => {
  const scrollHeight = document.body.offsetHeight;
  const scrollPosition = window.innerHeight + window.scrollY;

  if (scrollPosition >= scrollHeight * scrollThreshold) {
    loader.style.display = "block";
    isLoading = true;
    fetchMoreVideos(query).finally(() => {
      loader.style.display = "none";
      isLoading = false;
    });
  }
});

const setVideoId = (videoId) => {
  window.location.href = `./watch.html?id=${encodeURIComponent(videoId)}`;
};

const setChannelId = (channelId) => {
  window.location.href = `./channel.html?id=${encodeURIComponent(channelId)}`;
};

