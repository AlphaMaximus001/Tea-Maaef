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
  let apiReady = false;
  let stateChanged = false;
  let consecutiveErrors = 0;

  function showAdBlockNotice() {
    console.error("[player] cued but no state change after 6s — likely blocked by an ad blocker (e.g. Brave Shields, uBlock)");
    trackTitle.textContent = "एडब्लॉकर इसे रोक रहा है";
    trackArtist.textContent = "इस साइट के लिए शील्ड्स/एडब्लॉकर बंद करें";
  }

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
    console.log("[player] YT API ready, constructing player");
    apiReady = true;
    try {
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
            console.log("[player] onReady, cueing", YT_VIDEO_IDS.length, "tracks");
            e.target.cuePlaylist({ playlist: YT_VIDEO_IDS });
            e.target.setShuffle(true);
            updateTrackMeta();
            // if cuePlaylist never actually progresses (e.g. an ad blocker silently
            // drops the requests the embed needs), say so instead of spinning forever
            setTimeout(() => {
              if (!stateChanged) showAdBlockNotice();
            }, 6000);
          },
          onStateChange: (e) => {
            console.log("[player] state change:", e.data);
            stateChanged = true;
            if (e.data !== YT.PlayerState.UNSTARTED) consecutiveErrors = 0;
            updateTrackMeta();
            if (e.data === YT.PlayerState.PLAYING) {
              playIcon.innerHTML = ICON_PAUSE;
              startProgressLoop();
            } else {
              playIcon.innerHTML = ICON_PLAY;
              stopProgressLoop();
            }
          },
          // a track can be broken/removed/region-blocked; skip it instead of getting stuck
          onError: (e) => {
            console.warn("[player] track error:", e.data);
            consecutiveErrors += 1;
            if (consecutiveErrors <= YT_VIDEO_IDS.length && ytPlayer) {
              ytPlayer.nextVideo();
            } else {
              trackTitle.textContent = "गाने लोड नहीं हो पाए";
              trackArtist.textContent = "बाद में दोबारा कोशिश करें";
            }
          },
        },
      });
    } catch (err) {
      console.error("[player] failed to construct YT.Player:", err);
      trackTitle.textContent = "प्लेयर शुरू नहीं हो सका";
      trackArtist.textContent = String(err && err.message || err);
    }
  };

  function showLoadFailure(reason) {
    console.error("[player] YouTube IFrame API failed to load:", reason);
    trackTitle.textContent = "प्लेयर लोड नहीं हो सका";
    trackArtist.textContent = "कंसोल देखें (F12)";
  }

  console.log("[player] requesting YouTube IFrame API script");
  const apiTag = document.createElement("script");
  apiTag.src = "https://www.youtube.com/iframe_api";
  apiTag.onerror = () => showLoadFailure("script failed to load (network/blocked)");
  document.head.appendChild(apiTag);

  // if the script loads but YouTube never calls back, surface that instead of spinning forever
  setTimeout(() => {
    if (!apiReady) showLoadFailure("onYouTubeIframeAPIReady never fired within 6s");
  }, 6000);

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
