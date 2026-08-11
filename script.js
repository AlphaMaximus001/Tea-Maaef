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

// crossfade the static poster out once the hero video actually has a frame ready
(function crossfadePoster() {
  const video = document.getElementById("heroVideo");
  const poster = document.querySelector(".hero__poster");
  if (!video || !poster) return;

  function reveal() {
    poster.classList.add("is-hidden");
  }

  if (video.readyState >= 2) {
    reveal();
  } else {
    video.addEventListener("canplay", reveal, { once: true });
    video.addEventListener("playing", reveal, { once: true });
  }
})();

// floating audio player, backed directly by the given YouTube playlist
(function setupPlayer() {
  const YT_PLAYLIST_ID = "PLVwbgC8mRDea4xoSwC0ZNMiIr8OHiaFog";
  const MAX_CONSECUTIVE_ERRORS = 15;

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

  // --- raw postMessage control of a bare youtube.com/embed iframe -------------
  // Deliberately skips youtube.com/iframe_api (the official JS wrapper): that
  // script's own internal analytics/logging calls are what was getting blocked
  // by Brave Shields and by Firefox's default privacy protections, stalling
  // playback before it ever started. Talking to the embed directly via
  // postMessage is the same underlying protocol the wrapper itself uses, minus
  // that extra bootstrap script.
  const YT_ORIGIN = "https://www.youtube.com";
  const iframe = document.getElementById("yt-player");
  const PLAYER_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

  let ready = false;
  let stateChanged = false;
  let lastKnownState = PLAYER_STATE.UNSTARTED;
  let lastVideoId = null;
  let consecutiveErrors = 0;
  let heartbeatHandle = null;
  let noticeShown = false;

  function sendListening() {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "chai-garam-player" }), YT_ORIGIN);
    }
  }

  function post(func, args) {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: args || [] }), YT_ORIGIN);
  }

  function showAdBlockNotice() {
    console.error("[player] iframe loaded but no info ever came back — likely blocked by an ad blocker or the browser's privacy protections (Brave Shields, Firefox ETP/fingerprinting resistance, etc.)");
    trackTitle.textContent = "ब्राउज़र इसे रोक रहा है";
    trackArtist.textContent = "प्राइवेसी शील्ड्स/एडब्लॉकर बंद करके देखें";
  }

  function handleInfo(info) {
    if (!info) return;
    stateChanged = true;

    if (typeof info.playerState === "number" && info.playerState !== lastKnownState) {
      lastKnownState = info.playerState;
      console.log("[player] state change:", lastKnownState);
      if (lastKnownState !== PLAYER_STATE.UNSTARTED) consecutiveErrors = 0;
      if (lastKnownState === PLAYER_STATE.PLAYING) {
        playIcon.innerHTML = ICON_PAUSE;
      } else {
        playIcon.innerHTML = ICON_PLAY;
      }
    }

    const vd = info.videoData;
    if (vd && vd.video_id && vd.video_id !== lastVideoId) {
      lastVideoId = vd.video_id;
      trackTitle.textContent = vd.title || "चाय गरम रेडियो";
      trackArtist.textContent = vd.author || "YouTube";
      if (ytThumbFallback) ytThumbFallback.remove();
      ytThumb.style.backgroundImage = `url(https://img.youtube.com/vi/${vd.video_id}/hqdefault.jpg)`;
    }

    if (typeof info.currentTime === "number" && typeof info.duration === "number") {
      curTime.textContent = fmt(info.currentTime);
      durTime.textContent = fmt(info.duration);
      progressBar.style.width = info.duration ? `${(info.currentTime / info.duration) * 100}%` : "0%";
    }

    if (info.errorCode || info.playerError) {
      console.warn("[player] track error:", info.errorCode || info.playerError);
      consecutiveErrors += 1;
      if (consecutiveErrors <= MAX_CONSECUTIVE_ERRORS) {
        post("nextVideo");
      } else {
        trackTitle.textContent = "गाने लोड नहीं हो पाए";
        trackArtist.textContent = "बाद में दोबारा कोशिश करें";
      }
    }
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== YT_ORIGIN) return;
    let data;
    try {
      data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    if (!data || typeof data !== "object") return;

    if (data.event === "initialDelivery" || data.event === "infoDelivery") {
      if (!ready) {
        ready = true;
        console.log("[player] embed responded, ready");
        post("setShuffle", [true]);
      }
      handleInfo(data.info);
    }
  });

  iframe.addEventListener("load", () => {
    console.log("[player] embed iframe loaded, sending listen handshake");
    // YouTube's embed only pushes fresh currentTime/duration in response to a
    // "listening" ping — it's not a one-time handshake, the parent has to keep
    // pinging for the whole session or progress just stops updating.
    let attempts = 0;
    heartbeatHandle = setInterval(() => {
      attempts += 1;
      if (!ready && !noticeShown && attempts > 20) {
        noticeShown = true;
        showAdBlockNotice();
      }
      sendListening();
    }, 250);
  });

  const params = new URLSearchParams({
    enablejsapi: "1",
    controls: "0",
    disablekb: "1",
    autoplay: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    list: YT_PLAYLIST_ID,
    origin: window.location.origin,
  });
  console.log("[player] loading embed for playlist", YT_PLAYLIST_ID);
  iframe.src = `${YT_ORIGIN}/embed/videoseries?${params.toString()}`;

  playBtn.addEventListener("click", () => {
    if (lastKnownState === PLAYER_STATE.PLAYING) {
      post("pauseVideo");
    } else {
      post("playVideo");
    }
  });

  prevBtn.addEventListener("click", () => post("previousVideo"));
  nextBtn.addEventListener("click", () => post("nextVideo"));
})();
