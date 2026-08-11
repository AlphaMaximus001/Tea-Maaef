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

// floating audio player
(function setupPlayer() {
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const progressBar = document.getElementById("progressBar");
  const curTime = document.getElementById("curTime");
  const durTime = document.getElementById("durTime");
  if (!audio || !playBtn) return;

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  playBtn.addEventListener("click", () => {
    if (!audio.src) return; // no track wired up yet — placeholder state
    if (audio.paused) {
      audio.play();
      playIcon.innerHTML = ICON_PAUSE;
    } else {
      audio.pause();
      playIcon.innerHTML = ICON_PLAY;
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    durTime.textContent = fmt(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    curTime.textContent = fmt(audio.currentTime);
    if (audio.duration) {
      progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  audio.addEventListener("ended", () => {
    playIcon.innerHTML = ICON_PLAY;
  });
})();
