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

// live "people here right now" counter, backed by /api/presence (Vercel KV)
(function trackPresence() {
  const el = document.getElementById("onlineCount");
  if (!el) return;

  const SESSION_KEY = "chai-adda-session-id";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  async function ping() {
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
        keepalive: true,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.count === "number") el.textContent = data.count;
    } catch {
      // presence endpoint unreachable — leave the last known count in place
    }
  }

  ping();
  setInterval(ping, 10000);
})();

// floating audio player, backed by an explicit list of YouTube video IDs
// (matched to the "Chai & Classics" Spotify playlist, one lookup per track)
(function setupPlayer() {
  const YT_VIDEO_IDS = [
    "mFNNKeunEeY", "waeAGdCvJd8", "hjfzFVw2Zjo", "569LRWPPYqI", "eCpbYmO4Ndo",
    "4h4MIVYS6S8", "aqppgtdWt4M", "d_5yHuh7L54", "HxMZXp-ur3I", "YJTLMl1iRW4",
    "L8ywQkyf37k", "jMS9Kcl1ilQ", "QkGqpVYjLUw", "xP2OcqFcKSY", "b04C6hKGLXA",
    "o4qTd5VhLcs", "hD0vuSJxzmc", "rGJO3P_UAzs", "j4U8GzVz75M", "SBFagY_I8sM",
    "Ju6kNKaBOQ8", "rzG0m0czKF4", "1RUuRXBq9a0", "aZyWUVTg0Ps", "ME0fguaRPhA",
    "beXSXmBLmgg", "3ct4ppLwXCQ", "1n13FVRtVxs", "W6tsny4iFJY", "wulRtvNuTl8",
    "xImqpaP5j2k", "b4Fok9Y3sho", "ofjT0GcUijo", "vJTl-BcE0Fk", "swRditfMHK8",
    "w0AkZQUokog", "jyYqrVfopxo", "E6L_qqUx7aY", "qT6ryaYvY9M", "EYMeqpY5HFg",
    "BqdzXlDfubg", "aSJ_jcEPOu0", "Zv7n2juHqQI", "MH_Q8YCS7CI", "_lgACMqCpus",
    "P4ofSL-n3s0", "dynXfBVQ_zk", "ciU2Kb0bxew", "PUBaJz8eoRk", "4U1HsYrcHuc",
  ];

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
    trackTitle.textContent = data.title || "चाय गरम रेडियो";
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
        autoplay: 0,
        controls: 0,
        disablekb: 1,
      },
      events: {
        onReady: (e) => {
          e.target.cuePlaylist({ playlist: YT_VIDEO_IDS });
          e.target.setShuffle(true);
          updateTrackMeta();
        },
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
