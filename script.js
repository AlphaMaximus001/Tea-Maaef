// ===================== time-aware state (सुबह / शाम / रात) =====================
(function setupState() {
  const tapri = document.getElementById("tapri");
  const toggle = document.getElementById("stateToggle");
  if (!tapri || !toggle) return;

  // 5–11am subah, 11am–8pm shaam, 8pm–5am raat — extended to cover the full day
  function stateForHour(h) {
    if (h >= 5 && h < 11) return "subah";
    if (h >= 11 && h < 20) return "shaam";
    return "raat";
  }

  function applyState(state) {
    tapri.setAttribute("data-state", state);
    toggle.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.state === state);
    });
  }

  applyState(stateForHour(new Date().getHours()));

  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-state]");
    if (btn) applyState(btn.dataset.state);
  });
})();

// ===================== rotating shayari lines =====================
(function setupShayari() {
  const el = document.getElementById("shayariLine");
  if (!el) return;

  const LINES = [
    "एक कटिंग में पूरी दुनिया सुलझ जाती है",
    "चाय ठंडी हो गई, बातें नहीं",
    "पैसे कल दे देना, चाय आज पी लो",
    "यहाँ हर कोई फिलॉसफर है — शाम छह बजे के बाद",
    "बिस्किट डूबा, थोड़ा टूटा — ऐसा ही होता है",
    "चीनी कम, बातें ज़्यादा",
    "टपरी बंद नहीं होती, बस चाचा सो जाते हैं",
    "दो लोग, एक कटिंग, तीन घंटे",
    "सबसे अच्छी चाय हमेशा किसी और के पैसे की होती है",
    "कुल्हड़ टूटे तो टूटे, यारी नहीं टूटती",
    "सुबह की पहली चाय, दिन का पहला वादा",
    "भाप के साथ थोड़ी थकान भी उड़ जाती है",
    "यहाँ मीटिंग नहीं होती, बस अड्डा जमता है",
    "गरम चाय और ठंडी बातचीत — दोनों का अपना मज़ा है",
    "उधार की चाय, हिसाब का काम नहीं",
    "एक घूंट में सारी शिकायतें भूल जाती हैं",
    "कुर्सी खाली नहीं रहती, बस मालिक बदलते रहते हैं",
    "यहाँ हर कप के साथ एक कहानी मुफ़्त मिलती है",
    "काम टल सकता है, चाय का टाइम नहीं",
    "जितनी देर चाय बने, उतनी देर सुकून मिलता है",
    "यहाँ बहस होती है, दुश्मनी नहीं",
    "बारिश हो या धूप, केतली हमेशा गरम रहती है",
    "चाय की चुस्की और सोच की गहराई साथ-साथ बढ़ती है",
    "यहाँ हर शाम पुरानी लगती है, फिर भी नई होती है",
    "दो कप चाय में आधी ज़िंदगी बीत जाती है",
    "यहाँ वक्त धीरे चलता है, जानबूझकर",
    "कड़क चाय, नरम दिल",
    "एक कटिंग कम, बात ज़्यादा — यही तो असली सौदा है",
    "यहाँ आवाज़ें ऊँची होती हैं, नियत साफ़ रहती है",
    "चाय बनी नहीं कि अड्डा जम गया",
    "रोज़ की चाय, रोज़ की जान-पहचान",
    "यहाँ थकान उतरती है, बिल नहीं चढ़ता ज़्यादा",
    "आधी रात की चाय, आधी रात की सच्ची बातें",
    "यहाँ हर कोई रेगुलर है, बस नाम याद नहीं रहता",
    "एक कुल्हड़ चाय, हज़ार बहाने अड्डे पर बैठने के",
    "सुबह की चाय जगाती है, शाम की चाय सुनाती है",
    "यहाँ हिसाब चाय का रहता है, दिल का नहीं",
    "भाप उड़े, ग़म उड़े",
    "यहाँ बातें उबलती हैं, चाय के साथ-साथ",
    "एक टपरी, हज़ार कहानियाँ, एक ही केतली",
    "यहाँ देर से आना चलता है, ना आना नहीं चलता",
    "चाय की तरह ही, रिश्ते भी थोड़े कड़क अच्छे लगते हैं",
    "यहाँ शाम ढलती है, अड्डा नहीं",
    "चाय ठंडी हो जाए तो दोबारा बनती है, बात नहीं",
  ];

  let order = [];
  let idx = 0;

  function reshuffle() {
    order = LINES.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    idx = 0;
  }

  function showNext() {
    if (idx >= order.length) reshuffle();
    el.classList.remove("is-visible");
    setTimeout(() => {
      el.textContent = LINES[order[idx]];
      idx += 1;
      el.classList.add("is-visible");
    }, 300);
  }

  reshuffle();
  showNext();
  setInterval(showNext, 5500);
})();

// ===================== real canvas particle steam =====================
(function setupSteam() {
  const canvas = document.getElementById("steamCanvas");
  const svgArt = document.querySelector(".tapri__art");
  if (!canvas || !svgArt) return;
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, dpr = 1;
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // spawn points in the 900x900 SVG coordinate space, mapped to canvas %
  const SOURCES = [
    { x: 330 / 900, y: 555 / 900 }, // kulhad rim
    { x: 590 / 900, y: 466 / 900 }, // kettle spout
  ];

  let particles = [];

  function spawn() {
    const src = SOURCES[Math.random() < 0.5 ? 0 : 1];
    particles.push({
      x: src.x * w + (Math.random() - 0.5) * 10,
      y: src.y * h,
      vx: (Math.random() - 0.5) * 6,
      vy: -(18 + Math.random() * 14),
      life: 0,
      maxLife: 2.6 + Math.random() * 1.4,
      size: 4 + Math.random() * 6,
    });
  }

  let lastSpawn = 0;
  let lastFrame = performance.now();

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    if (now - lastSpawn > 90) {
      spawn();
      lastSpawn = now;
    }

    ctx.clearRect(0, 0, w, h);
    particles = particles.filter((p) => p.life < p.maxLife);

    for (const p of particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += (Math.random() - 0.5) * 6 * dt;
      p.vy *= 0.995;

      const t = p.life / p.maxLife;
      const opacity = Math.sin(Math.min(t, 1) * Math.PI) * 0.5;
      const radius = p.size * (0.6 + t * 1.8);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(242,230,208,${opacity})`);
      grad.addColorStop(1, "rgba(242,230,208,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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

  // The embed only pushes a fresh currentTime on real state-change events
  // (play/pause/etc), not continuously during playback. So track a local
  // clock between snapshots for a smooth live display, and resync to the
  // authoritative value (correcting drift) whenever a real one arrives.
  let syncedTime = 0;
  let syncedDuration = 0;
  let syncedAt = 0;
  let tickHandle = null;

  function tickProgress() {
    if (lastKnownState !== PLAYER_STATE.PLAYING || !syncedDuration) return;
    const elapsed = (Date.now() - syncedAt) / 1000;
    const projected = Math.min(syncedTime + elapsed, syncedDuration);
    curTime.textContent = fmt(projected);
    progressBar.style.width = `${(projected / syncedDuration) * 100}%`;
  }

  function sendListening() {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "tapri-player" }), YT_ORIGIN);
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
      trackTitle.textContent = vd.title || "टपरी रेडियो";
      trackArtist.textContent = vd.author || "YouTube";
      if (ytThumbFallback) ytThumbFallback.remove();
      ytThumb.style.backgroundImage = `url(https://img.youtube.com/vi/${vd.video_id}/hqdefault.jpg)`;
    }

    if (typeof info.currentTime === "number" && typeof info.duration === "number") {
      syncedTime = info.currentTime;
      syncedDuration = info.duration;
      syncedAt = Date.now();
      durTime.textContent = fmt(info.duration);
      tickProgress();
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
    let attempts = 0;
    heartbeatHandle = setInterval(() => {
      attempts += 1;
      if (!ready && !noticeShown && attempts > 20) {
        noticeShown = true;
        showAdBlockNotice();
      }
      sendListening();
    }, 250);
    tickHandle = setInterval(tickProgress, 250);
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
