// live clock
function tickClock() {
  const el = document.getElementById("liveClock");
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  el.textContent = `${h}:${m} ${ampm}`;
}
tickClock();
setInterval(tickClock, 1000 * 15);

// ambient "online now" counter (fake, gently drifting — swap for real data later)
(function driftOnlineCount() {
  const el = document.getElementById("onlineCount");
  if (!el) return;
  let count = 24 + Math.floor(Math.random() * 20);
  el.textContent = count;
  setInterval(() => {
    count += Math.floor(Math.random() * 5) - 2;
    count = Math.max(8, count);
    el.textContent = count;
  }, 4000);
})();

// floating audio player, backed by a YouTube playlist via the IFrame Player API
(function setupPlayer() {
  const YT_PLAYLIST_ID = "PLVwbgC8mRDea4xoSwC0ZNMiIr8OHiaFog";

  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progressBar = document.getElementById("progressBar");
  const curTime = document.getElementById("curTime");
  const durTime = document.getElementById("durTime");
  const trackTitle = document.getElementById("trackTitle");
  const trackArtist = document.getElementById("trackArtist");
  const ytThumb = document.getElementById("ytThumb");
  const ytThumbFallback = document.getElementById("ytThumbFallback");
  if (!playBtn) return;

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  let ytPlayer = null;
  let progressTimer = null;

  function updateTrackMeta() {
    if (!ytPlayer || typeof ytPlayer.getVideoData !== "function") return;
    const data = ytPlayer.getVideoData();
    if (!data || !data.video_id) return;
    trackTitle.textContent = data.title || "चाय अड्डा रेडियो";
    trackArtist.textContent = data.author || "YouTube";
    if (ytThumbFallback) ytThumbFallback.remove();
    ytThumb.style.backgroundImage = `url(https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg)`;
  }

  function updateProgress() {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration() || 0;
    curTime.textContent = fmt(cur);
    durTime.textContent = fmt(dur);
    progressBar.style.width = dur ? `${(cur / dur) * 100}%` : "0%";
  }

  function startProgressLoop() {
    clearInterval(progressTimer);
    progressTimer = setInterval(updateProgress, 500);
  }

  function stopProgressLoop() {
    clearInterval(progressTimer);
  }

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("yt-player", {
      height: "1",
      width: "1",
      playerVars: {
        listType: "playlist",
        list: YT_PLAYLIST_ID,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
      },
      events: {
        onReady: updateTrackMeta,
        onStateChange: (e) => {
          updateTrackMeta();
          if (e.data === YT.PlayerState.PLAYING) {
            playIcon.innerHTML = ICON_PAUSE;
            startProgressLoop();
          } else {
            playIcon.innerHTML = ICON_PLAY;
            stopProgressLoop();
          }
        },
      },
    });
  };

  const apiTag = document.createElement("script");
  apiTag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(apiTag);

  playBtn.addEventListener("click", () => {
    if (!ytPlayer || typeof ytPlayer.getPlayerState !== "function") return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  });

  prevBtn.addEventListener("click", () => ytPlayer && ytPlayer.previousVideo());
  nextBtn.addEventListener("click", () => ytPlayer && ytPlayer.nextVideo());
})();
