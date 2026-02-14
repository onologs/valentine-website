/* script.js - lengkap */
/* Dedikasi */
alert("I dedicate this site for my one and only, Mayzahra Arfianie Sigit.");

/* ====== Basic UI ====== */
function handleCredentialResponse() {
  document.getElementById("login").style.display = "none";
  document.getElementById("content").style.display = "block";
  document.body.classList.add("logged-in");
}

function showMessage() {
  const button = document.getElementById("letter-button");
  const letter = document.getElementById("letter-popup");
  const overlay = document.getElementById("overlay");

  button.classList.add("shake");
  setTimeout(() => button.classList.remove("shake"), 400);

  setTimeout(() => {
    overlay.classList.add("show");
    letter.classList.add("show");
    document.body.classList.add("blur");
  }, 700);
}

document.getElementById("overlay").addEventListener("click", closeLetter);

function closeLetter() {
  document.getElementById("letter-popup").classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
  document.body.classList.remove("blur");
}

/* ===== Timeline Logic ===== */
let currentTimeline = 0;

function showTimeline() {
  document.getElementById("letter-popup").classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
  document.body.classList.remove("blur");
  document.getElementById("next-btn").classList.remove("show");

  setTimeout(() => {
    document.getElementById("timeline").classList.add("show");

    // panah muncul setelah delay
    setTimeout(() => {
      const arrow = document.getElementById("timeline-next");
      // ensure arrow uses opacity-only transition (CSS)
      arrow.classList.add("show", "pulse");
    }, 900);

  }, 500);
}

function nextTimeline() {
  const items = document.querySelectorAll(".timeline-item");
  const arrow = document.getElementById("timeline-next");

  // remove current
  if (items[currentTimeline]) items[currentTimeline].classList.remove("active");
  currentTimeline++;

  // jika sudah foto terakhir → lanjut ke constellation (pakai cinematic transition)
  if (currentTimeline >= items.length) {
    // fade arrow out (no movement) — remove 'pulse' then remove 'show' so CSS handles fade
    arrow.classList.remove("pulse");
    arrow.classList.remove("show");

    // wait small amount for fade to complete (CSS handles), then do cinematic
    setTimeout(() => cinematicTransition(() => showConstellation()), 420);
    return;
  }

  // show next
  if (items[currentTimeline]) items[currentTimeline].classList.add("active");

  // pastikan panah tetap hidup di foto sebelumnya
  arrow.classList.add("show", "pulse");
}

/* ===== Next Button Observer ===== */
const letterPopup = document.getElementById("letter-popup");
const nextBtn = document.getElementById("next-btn");

const observer = new MutationObserver(() => {
  if (letterPopup.classList.contains("show")) {
    nextBtn.classList.add("show");
  } else {
    nextBtn.classList.remove("show");
  }
});

observer.observe(letterPopup, { attributes: true });

/* ===== Memory Constellation ===== */
/* Memori: gunakan s1..s5 dari paper/ */
const memories = [
  { img: "paper/s1.png", text: "Words that became us." },
  { img: "paper/s2.png", text: "I dedicate every note to you. My hobby turned into a quiet way of saying I care." },
  { img: "paper/s3.png", text: "First text on WhatsApp! a tiny hello that became a big beginning." },
  { img: "paper/s4.png", text: "Two pairs of steps, one quiet path I want to walk with you." },
  { img: "paper/s5.png", text: "Fuzzy on the screen, clear in my head. You and me." }
];

/* Preload images for smooth popup */
memories.forEach(m => {
  const p = new Image();
  p.src = m.img;
});

let openedMemories = 0;

/* Entry point: called from timeline end */
function showConstellation() {
  // hide timeline first
  document.getElementById("timeline").classList.remove("show");

  // ensure blackout is not active (constellation should show behind)
  document.body.classList.remove("blackout");

  document.getElementById("constellation").classList.add("show");
  initStars();
}

/* ===== Starfield & Constellation Implementation ===== */
const canvas = document.getElementById("starfield");
const ctx = canvas ? canvas.getContext("2d") : null;
let stars = [];
let starAnimationId = null;

/* Node connection coords (calculated from DOM nodes) */
let nodeCoords = []; // [{x,y}, ...]
let connPhase = 0;   // animated phase for connection shimmer

/* Cinematic extras (breathing glow, parallax, reveal) */
let breathe = 0;
let drift = 0;
let revealProgress = 0;

function initStars() {
  if (!canvas || !ctx) return;
  if (starAnimationId) cancelAnimationFrame(starAnimationId);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  stars = Array.from({length: 140}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*1.2 + 0.3,
    s: Math.random()*0.5 + 0.1,
    tw: Math.random()*0.02 + 0.005
  }));

  computeNodeCoords(); // compute connection points from .star-node elements

  // center constellation precisely (important: call after computeNodeCoords so bounding boxes correct)
  // small timeout ensures layout transforms applied before measuring
  setTimeout(() => {
    centerConstellation();
    // recompute coords after centering so drawing lines are correct
    computeNodeCoords();
  }, 40);

  animateStars();
}

/* compute node positions (center of each .star-node) relative to canvas */
function computeNodeCoords() {
  const nodes = document.querySelectorAll(".star-node");
  nodeCoords = [];
  if (!canvas) return;
  const cRect = canvas.getBoundingClientRect();
  nodes.forEach(n => {
    const r = n.getBoundingClientRect();
    const x = (r.left + r.width/2) - cRect.left;
    const y = (r.top + r.height/2) - cRect.top;
    nodeCoords.push({x: x, y: y});
  });
}

/* centerConstellation: shift .stage horizontally so the nodes group is centered in viewport */
function centerConstellation() {
  const stage = document.querySelector('.nodes .stage');
  if (!stage) return;
  const nodes = Array.from(stage.querySelectorAll('.star-node'));
  if (nodes.length === 0) {
    // reset transform to default if no nodes
    stage.style.transform = 'translate(-50%, -50%)';
    return;
  }

  // hitung bounding box horizontal dari semua node (dalam koordinat viewport)
  let minX = Infinity, maxX = -Infinity;
  nodes.forEach(n => {
    const r = n.getBoundingClientRect();
    if (r.left < minX) minX = r.left;
    if (r.right > maxX) maxX = r.right;
  });

  const nodesCenter = (minX + maxX) / 2;
  const viewportCenter = window.innerWidth / 2;
  const dx = Math.round(viewportCenter - nodesCenter); // px

  // keep base translate(-50%,-50%) then apply translateX compensation
  stage.style.transform = `translate(-50%, -50%) translateX(${dx}px)`;
}

/* draw soft connection lines between nodes with cinematic shimmer */
function drawConnections() {
  if (!ctx || nodeCoords.length === 0) return;

  ctx.save();

  // compute breathe glow and small drift offsets
  const breatheGlow = 0.04 + 0.04 * Math.sin(breathe);
  const driftAmp = Math.min(10, Math.max(4, canvas.width * 0.004)); // scale drift with width slightly

  // build a temporary array of offset coords so we don't mutate nodeCoords
  const coords = nodeCoords.map((p, i) => {
    const offsetX = Math.sin(drift + i * 0.6) * (driftAmp * 0.6);
    const offsetY = Math.cos(drift * 1.1 + i * 0.9) * (driftAmp * 0.45);
    return { x: p.x + offsetX, y: p.y + offsetY };
  });

  // reveal mask (how many links to show)
  const maxLinks = Math.floor(coords.length * revealProgress);

  // ultra-soft base haze line (very faint)
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = `rgba(170,200,255,${0.02 + breatheGlow * 0.5})`;
  ctx.beginPath();
  coords.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  if (coords.length > 2) ctx.closePath();
  ctx.stroke();

  // shimmer cinematic lines (delayed reveal per-link)
  coords.forEach((p, i) => {
    if (i > maxLinks && revealProgress < 1) return;

    const q = coords[(i + 1) % coords.length];
    if (!q) return;

    const shimmer = 0.05 + 0.06 * Math.sin(connPhase + i * 0.9);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = `rgba(180,215,255,${Math.min(0.45, shimmer + breatheGlow)})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // breathing halo glow around nodes
  coords.forEach((p, i) => {
    const pulse = 0.06 + 0.05 * Math.sin(breathe * 1.2 + i);
    const radius = 8 + Math.sin(breathe * 1.4 + i) * 1.6;
    ctx.beginPath();
    ctx.fillStyle = `rgba(200,225,255,${pulse})`;
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // subtle dotted cross-links for depth
  coords.forEach((p, i) => {
    for (let j = i + 2; j < coords.length; j += 2) {
      const r = coords[j];
      const dx = r.x - p.x;
      const dy = r.y - p.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < Math.max(canvas.width, canvas.height) * 0.45) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(r.x, r.y);
        const alpha = 0.01 + 0.015 * Math.abs(Math.sin(connPhase + i + j));
        ctx.strokeStyle = `rgba(170,190,210,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  });

  ctx.restore();
}

/* main animation loop */
function animateStars() {
  if (!ctx) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // subtle radial mist for depth
  const g = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
  g.addColorStop(0, 'rgba(255,255,255,0.02)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // update connection animation phase (shimmer)
  connPhase += 0.008;

  // cinematic extras update
  breathe += 0.015;            // breathing speed
  drift += 0.0009 + (Math.sin(performance.now()*0.00005) * 0.0002); // very subtle variation
  if (revealProgress < 1) revealProgress = Math.min(1, revealProgress + 0.006); // reveal links gradually

  // draw connections behind stars
  drawConnections();

  // draw stars on top
  ctx.fillStyle = "rgba(255,255,255,1)";
  stars.forEach((star, i) => {
    ctx.beginPath();
    ctx.globalAlpha = 0.9 + Math.sin(i * star.tw + performance.now() * 0.001) * 0.1;
    ctx.arc(star.x, star.y, star.r, 0, Math.PI*2);
    ctx.fill();

    star.y += star.s;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random()*canvas.width;
    }
  });
  ctx.globalAlpha = 1;
  starAnimationId = requestAnimationFrame(animateStars);
}

/* Node Interaction: open memory popup */
/* Use delegated binding to ensure nodes exist */
document.addEventListener('click', function (ev) {
  const node = ev.target.closest('.star-node');
  if (!node) return;
  const id = Number(node.dataset.id);
  if (Number.isNaN(id) || !memories[id]) return;
  openMemory(id);
  node.style.opacity = ".25";
  node.style.pointerEvents = "none";
});

/* when constellation becomes visible, recompute node coords (in case layout changed) */
const constellationEl = document.getElementById("constellation");
if (constellationEl) {
  new MutationObserver((mut)=> {
    if (constellationEl.classList.contains("show")) {
      // tiny delay to ensure layout applied
      setTimeout(()=> {
        computeNodeCoords();
        // center constellation precisely
        centerConstellation();
        // reset reveal so lines animate every time constellation appears
        revealProgress = 0;
        initStars(); // restart starfield for crispness
      }, 80);
    } else {
      // if constellation hidden, reset any stage transform so it doesn't affect other scenes
      const stage = document.querySelector('.nodes .stage');
      if (stage) stage.style.transform = 'translate(-50%, -50%)';
    }
  }).observe(constellationEl, { attributes: true });
}

/* open memory popup: wait for image to load to ensure smoothness (fixes s2 stutter) */
function openMemory(i) {
  const popup = document.getElementById("memory-popup");
  const imgEl = document.getElementById("memory-img");
  const textEl = document.getElementById("memory-text");

  // prepare: hide popup immediately (in case previously visible)
  popup.classList.remove("show");
  imgEl.style.opacity = '0';
  imgEl.style.transform = 'scale(0.98)';
  // set text and new src
  textEl.innerText = memories[i].text;
  imgEl.src = memories[i].img;

  // wait for image to be loaded (cached or fresh) to avoid pop-in stutter
  if (imgEl.complete) {
    // small timeout to let browser pick up styles
    setTimeout(()=> {
      popup.classList.add("show");
      imgEl.style.opacity = '1';
      imgEl.style.transform = 'scale(1)';
    }, 40);
  } else {
    imgEl.onload = function() {
      setTimeout(()=> {
        popup.classList.add("show");
        imgEl.style.opacity = '1';
        imgEl.style.transform = 'scale(1)';
      }, 40);
    };
  }
}

/* Close memory popup on click anywhere in popup */
document.getElementById("memory-popup").addEventListener("click", ()=> {
  const popup = document.getElementById("memory-popup");
  popup.classList.remove("show");
  openedMemories++;
  if (openedMemories >= memories.length) {
    // all opened → cinematic transition into reflection
    cinematicTransition(() => showReflection());
  }
});

/* Ensure canvas resizes on window change */
window.addEventListener("resize", ()=> {
  if (document.getElementById("constellation").classList.contains("show")) {
    // recompute coords and surface
    computeNodeCoords();
    // recenter constellation after layout change
    centerConstellation();
    // re-init stars for crisp sizes
    initStars();
  } else {
    // still resize canvas to avoid awkward sizes later
    if (canvas && ctx) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
});

/* ===== Cinematic transition overlay =====
   CSS duration is 1200ms; we call callback after the fade-in completes.
*/
function cinematicTransition(callback) {
  const fade = document.getElementById("cinema-fade");
  if (!fade) {
    if (typeof callback === "function") callback();
    return;
  }

  const fadeDuration = 1200; // ms — keep in sync with CSS
  fade.classList.add("show");

  // after fade-in completes, run callback to setup next scene while screen is black
  setTimeout(() => {
    if (typeof callback === "function") callback();

    // small delay to ensure callback DOM changes applied, then fade out
    setTimeout(() => {
      fade.classList.remove("show");
    }, 200); // short gap
  }, fadeDuration);
}

/* ===== Reflection Sequence ===== */
let reflectionIndex = 0;
const reflectionTexts = document.querySelectorAll(".reflection-text");

function showReflection() {
  // mulai dengan menambahkan poetic tapi tersembunyi, lalu lepas 'poetic-hidden'
  document.body.classList.add("poetic", "poetic-hidden");
  setTimeout(() => {
    document.body.classList.remove("poetic-hidden");
  }, 300);

  // hide constellation and stop star animation
  const constellation = document.getElementById("constellation");
  if (constellation) constellation.classList.remove("show");

  if (starAnimationId) {
    cancelAnimationFrame(starAnimationId);
    starAnimationId = null;
  }

  reflectionTexts.forEach(t => t.classList.remove("active"));
  reflectionIndex = 0;

  const reflectionEl = document.getElementById("reflection");
  if (reflectionEl) reflectionEl.classList.add("show");

  runReflectionSequence();
}

/* runReflectionSequence now adjusts delay for .big text */
function runReflectionSequence() {
  // clear previous active
  reflectionTexts.forEach(t => t.classList.remove("active"));

  // show current
  const el = reflectionTexts[reflectionIndex];
  if (!el) {
    return;
  }
  el.classList.add("active");

  // determine pacing: default 3200ms, but longer for ".big"
  let delay = 3200;
  if (el.classList.contains("big")) {
    delay = 7000; // extended duration for the larger line
  }

  reflectionIndex++;

  // schedule next or finish
  if (reflectionIndex < reflectionTexts.length) {
    setTimeout(runReflectionSequence, delay);
  } else {
    // finished reflection → cinematic transition into silent scene
    setTimeout(() => {
      document.body.classList.add('');

      cinematicTransition(() => {
        // hide reflection content (still blackout active)
        const reflectionEl = document.getElementById("reflection");
        if (reflectionEl) reflectionEl.classList.remove("show");
        // show silent scene WITHOUT fade (user requested no fade-out transition here)
        showSilentScene({ noFade: true });
      });
    }, 600);
  }
}

/* ===== Silent Scene & Final Ending ===== */
/* showSilentScene accepts options to disable fade transitions at show/hide */
function showSilentScene(options = {}) {
  const silent = document.getElementById("silent");

  if (options.noFade) {
    if (silent) silent.classList.add("no-fade");
  } else {
    if (silent) silent.classList.remove("no-fade");
  }

  // show silently (no fading if no-fade is present)
  if (silent) silent.classList.add("show");

  setTimeout(()=> {
    // hide without fade if requested
    if (options.noFade) {
      if (silent) {
        silent.classList.add("no-fade-hide");
        silent.classList.remove("show");
      }
      // clean up no-fade flags
      setTimeout(() => {
        if (silent) silent.classList.remove("no-fade", "no-fade-hide");
        // cinematic open into final (we keep blackout active until final shows)
        cinematicTransition(() => showFinalEnding({ noFade: true }));
      }, 40);
    } else {
      if (silent) silent.classList.remove("show");
      // cinematic open into final
      cinematicTransition(() => showFinalEnding());
    }
  }, 3500);
}

function showFinalEnding(options = {}) {
  const final = document.getElementById("final");

  if (options.noFade) {
    if (final) final.classList.add("no-fade");
  } else {
    if (final) final.classList.remove("no-fade");
  }

  // show final (no fade if requested)
  if (final) final.classList.add("show");

  // keep blackout and poetic as per original behavior
}

/* ===== Small safety: if user navigates directly to constellation, ensure init ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  // nothing required here because script loads at bottom,
  // but keep event to ensure compatibility
});

/* ======================
   BACKGROUND AUDIO: autoplay attempt + fallback UI
   ====================== */

/*
  Behavior:
  - audio element has loop attribute in HTML.
  - try audio.play() on load; if blocked, show #audio-hint
  - also try to play on first user gesture (click/touch/keydown)
  - audio will keep looping because of loop attribute
*/
(function initBackgroundAudio() {
  const audio = document.getElementById('bg-audio');
  const hint = document.getElementById('audio-hint');

  if (!audio) return;

  // Preferred playback volume (0.0 - 1.0)
  audio.volume = 0.88;

  // Try autoplay immediately
  function attemptPlay() {
    // returns a promise or undefined in older browsers
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // playing succeeded
        hideHint();
      }).catch((err) => {
        // autoplay blocked or other error -> show unobtrusive hint control
        showHint();
      });
    } else {
      // older browsers - assume playing
      hideHint();
    }
  }

  // Show the small hint/button so user can permit audio
  function showHint() {
    if (!hint) return;
    hint.hidden = false;
    hint.style.opacity = '1';
    // Focusable and accessible
    hint.addEventListener('click', userPlayHandler);
    hint.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') userPlayHandler();
    });
    // also listen for first user gesture anywhere to auto-try
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, userPlayHandlerOnce, { once: true, passive: true });
    });
  }

  function hideHint() {
    if (!hint) return;
    hint.hidden = true;
    hint.style.opacity = '0';
    hint.removeEventListener('click', userPlayHandler);
  }

  // When user clicks the hint, try to play and hide hint if succeed
  function userPlayHandler() {
    audio.play().then(() => {
      hideHint();
    }).catch(() => {
      // still blocked — keep hint visible
      // optionally, you could mute & play, then unmute — but we avoid that to respect UX
    });
  }

  // Called once on first user gesture anywhere
  function userPlayHandlerOnce() {
    audio.play().then(() => {
      hideHint();
    }).catch(() => {
      showHint();
    });
  }

  // Also attempt to resume audio when user performs interactions that already exist in UI
  const interactionTargets = [
    document.getElementById('letter-button'),
    document.getElementById('timeline-next'),
    document.getElementById('next-btn'),
    document.getElementById('overlay')
  ];
  interactionTargets.forEach(t => {
    if (t) t.addEventListener('click', () => {
      audio.play().catch(()=>{/* ignore */});
    });
  });

  // finally attempt to autoplay
  attemptPlay();

  // keep audio reference global in case you want to control it later
  window._bgAudio = audio;
})();
