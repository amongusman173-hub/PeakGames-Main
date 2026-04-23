// ── Audio setup ──
const clickSound = new Audio('sounds/buttonclick.mp3');
clickSound.volume = 0.4;

const bgMusic = new Audio('sounds/backroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.15;

// Persist music mute state across pages
const isMuted = sessionStorage.getItem('musicMuted') === 'true';
if (isMuted) bgMusic.volume = 0;

// Try to resume music immediately (works if user already interacted on a previous page)
bgMusic.play().catch(() => {});

// First interaction fallback
let musicStarted = false;
document.addEventListener('click', () => {
    if (!musicStarted) {
        bgMusic.play().catch(() => {});
        musicStarted = true;
    }
});

function playClick() {
    if (sessionStorage.getItem('musicMuted') !== 'true') {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) playClick();
});

// Music toggle
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('musicToggle');
    if (!btn) return;

    // Reflect current state
    if (isMuted) btn.classList.add('muted');

    btn.addEventListener('click', () => {
        const muted = sessionStorage.getItem('musicMuted') === 'true';
        if (muted) {
            bgMusic.volume = 0.15;
            bgMusic.play().catch(() => {});
            sessionStorage.setItem('musicMuted', 'false');
            btn.classList.remove('muted');
        } else {
            bgMusic.volume = 0;
            sessionStorage.setItem('musicMuted', 'true');
            btn.classList.add('muted');
        }
    });
});

// ── Hamburger menu ──
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('navHamburger');
    const mobileNav = document.getElementById('navMobile');
    if (!hamburger || !mobileNav) return;
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileNav.classList.remove('open');
        });
    });
});

// ── Smooth scrolling ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ── Preview toggle ──
function togglePreview(event) {
    const gameCard = event.target.closest('.game-card');
    const preview = gameCard.querySelector('.game-preview');
    const iframe = preview.querySelector('iframe');
    const thumb = preview.querySelector('.preview-thumb');
    const overlay = preview.querySelector('.preview-overlay');
    const button = event.target;

    if (preview.classList.contains('expanded')) {
        preview.classList.remove('expanded');
        button.textContent = 'Preview';
        iframe.src = 'about:blank';
        iframe.style.display = 'none';
        if (thumb) thumb.style.display = 'block';
        if (overlay) overlay.style.display = 'flex';
        gameCard.classList.remove('previewing');
        // Remove loader if present
        const loader = preview.querySelector('.preview-loader');
        if (loader) loader.remove();
    } else {
        // Close others first
        document.querySelectorAll('.game-preview.expanded').forEach(p => {
            p.classList.remove('expanded');
            const oi = p.querySelector('iframe');
            const ot = p.querySelector('.preview-thumb');
            const oo = p.querySelector('.preview-overlay');
            const ob = p.parentElement.querySelector('.btn-preview');
            const ol = p.querySelector('.preview-loader');
            oi.src = 'about:blank';
            oi.style.display = 'none';
            if (ot) ot.style.display = 'block';
            if (oo) oo.style.display = 'flex';
            if (ol) ol.remove();
            ob.textContent = 'Preview';
            p.closest('.game-card').classList.remove('previewing');
        });

        // Show loader while iframe loads
        preview.classList.add('expanded');
        button.textContent = 'Close Preview';
        if (thumb) thumb.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        gameCard.classList.add('previewing');

        // Inject loading screen
        const loader = document.createElement('div');
        loader.className = 'preview-loader';
        loader.innerHTML = `
            <div class="loader-inner">
                <div class="loader-ring"></div>
                <div class="loader-ring loader-ring-2"></div>
                <div class="loader-dots">
                    <span></span><span></span><span></span>
                </div>
                <p class="loader-text">Loading game...</p>
            </div>
        `;
        preview.appendChild(loader);

        iframe.style.display = 'block';
        iframe.style.opacity = '0';
        iframe.src = preview.dataset.src;

        // Fade in iframe once loaded, remove loader
        iframe.onload = () => {
            loader.classList.add('loader-fade-out');
            iframe.style.transition = 'opacity 0.4s ease';
            iframe.style.opacity = '1';
            setTimeout(() => loader.remove(), 400);
        };
    }
}

// ── Scroll progress bar ──
window.addEventListener('scroll', () => {
    const bar = document.getElementById('scrollProgress');
    if (bar) {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        bar.style.width = pct + '%';
    }
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.background = window.scrollY > 50
            ? 'rgba(6,6,14,0.98)'
            : 'rgba(6,6,14,0.8)';
    }
});

// ── Page loader ──
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;

    // Hide everything immediately
    const featured = document.getElementById('featuredGame');
    const gamesHeader = document.querySelector('.games-header');
    const cards = document.querySelectorAll('.game-card');

    const hideEl = (el) => {
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(32px)';
        el.style.transition = 'none';
    };

    hideEl(featured);
    hideEl(gamesHeader);
    cards.forEach(c => hideEl(c));

    // After bar fills → sweep loader out
    setTimeout(() => {
        loader.classList.add('loader-done');

        setTimeout(() => {
            loader.remove();

            const revealEl = (el, delay) => {
                if (!el) return;
                setTimeout(() => {
                    el.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, delay);
            };

            // Stagger: featured → header → cards one by one
            revealEl(featured, 0);
            revealEl(gamesHeader, 150);
            cards.forEach((card, i) => revealEl(card, 280 + i * 90));

        }, 500);
    }, 750);
});

// ── Search & filter ──
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('gameSearch');
    if (!searchInput) return;

    const categoryButtons = document.querySelectorAll('.category-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearch = document.getElementById('clearSearch');

    let currentCategory = 'all';
    let currentSearch = '';

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        filterGames();
        updateClearButton();
    });

    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterGames();
        });
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        currentCategory = 'all';
        categoryButtons.forEach(b => b.classList.remove('active'));
        categoryButtons[0].classList.add('active');
        filterGames();
        updateClearButton();
    });

    function filterGames() {
        let visibleCount = 0;
        gameCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            const desc = card.dataset.description.toLowerCase();
            const cats = card.dataset.category.toLowerCase();
            const match = (currentSearch === '' || title.includes(currentSearch) || desc.includes(currentSearch) || cats.includes(currentSearch))
                       && (currentCategory === 'all' || cats.includes(currentCategory));

            if (match) {
                card.style.display = 'block';
                card.offsetHeight;
                card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
                visibleCount++;
            } else {
                card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateY(16px) scale(0.97)';
                setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 260);
            }
        });
        resultsCount.textContent = `${visibleCount} game${visibleCount !== 1 ? 's' : ''} found`;
        showNoResults(visibleCount === 0);
    }

    function updateClearButton() {
        clearSearch.style.display = (currentSearch !== '' || currentCategory !== 'all') ? 'inline' : 'none';
    }

    function showNoResults(show) {
        let msg = document.querySelector('.no-results-message');
        if (show && !msg) {
            msg = document.createElement('div');
            msg.className = 'no-results-message';
            msg.innerHTML = `<div class="no-results-icon">🎮</div><h3>No games found</h3><p>Try a different search or category</p>`;
            document.querySelector('.games-grid').appendChild(msg);
        } else if (!show && msg) msg.remove();
    }

    filterGames();
});

// ── Recently Played ──
const GAMES_DATA = [
    { title: 'Lucky',               url: 'https://amongusman173-hub.github.io/PeakGames-Lucky/',         img: 'images/lucky.png',            tag: 'Casino' },
    { title: 'Fishin Time',         url: 'https://amongusman173-hub.github.io/PeakGames-Fishin/',        img: 'images/fishing time.png',     tag: 'Adventure' },
    { title: 'Roguelite Arena',     url: 'https://amongusman173-hub.github.io/PeakGames-Roguelite/',     img: 'images/rougelite arena.png',  tag: 'Action' },
    { title: 'Tower Defense',       url: 'https://amongusman173-hub.github.io/PeakGames-TowerDefense/', img: 'images/tower defense.png',    tag: 'Strategy' },
    { title: 'Untitled Incremental',url: 'https://amongusman173-hub.github.io/PeakGames-Incremental/',  img: 'images/incremental.png',      tag: 'Idle' },
    { title: 'Minefield',           url: 'https://amongusman173-hub.github.io/PeakGames-MineField/',    img: 'images/MineField.png',        tag: 'Action' },
    { title: "Night's Siege",       url: 'https://amongusman173-hub.github.io/PeakGames-Nights-Siege/', img: 'images/Night Siege.png',      tag: 'Action' },
];

function trackPlay(url) {
    let recent = JSON.parse(localStorage.getItem('recentGames') || '[]');
    recent = [url, ...recent.filter(u => u !== url)].slice(0, 3);
    localStorage.setItem('recentGames', JSON.stringify(recent));
}

function renderRecentlyPlayed() {
    const section = document.getElementById('recentlyPlayed');
    const grid = document.getElementById('recentlyGrid');
    if (!section || !grid) return;
    const recent = JSON.parse(localStorage.getItem('recentGames') || '[]');
    if (recent.length === 0) return;
    const games = recent.map(url => GAMES_DATA.find(g => g.url === url)).filter(Boolean);
    if (games.length === 0) return;
    grid.innerHTML = games.map(g => `
        <a href="${g.url}" target="_blank" class="recently-card" data-url="${g.url}">
            <img src="${g.img}" alt="${g.title}">
            <div class="recently-card-info">
                <span class="recently-card-name">${g.title}</span>
                <span class="recently-card-tag">${g.tag}</span>
            </div>
        </a>
    `).join('');
    section.style.display = 'block';

    // Track clicks from recently played too
    grid.querySelectorAll('.recently-card').forEach(card => {
        card.addEventListener('click', () => trackPlay(card.dataset.url));
    });
}

// Track play button clicks
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-play, .btn-primary');
    if (btn && btn.href && btn.href.includes('PeakGames')) {
        trackPlay(btn.href);
    }
});

// ── Random Game ──
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('randomGame');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const game = GAMES_DATA[Math.floor(Math.random() * GAMES_DATA.length)];
        // Flash the button
        btn.textContent = `🎲 ${game.title}!`;
        btn.style.background = 'linear-gradient(135deg, #667eea, #a78bfa)';
        btn.style.color = '#fff';
        setTimeout(() => {
            window.open(game.url, '_blank');
            trackPlay(game.url);
            setTimeout(() => {
                btn.textContent = '🎲 Random';
                btn.style.background = '';
                btn.style.color = '';
            }, 1500);
        }, 400);
    });
});

// ── Live Player Count ──
// Uses Firebase Realtime Database (free tier, full CORS)
// Setup: https://console.firebase.google.com → create project → Realtime Database → start in test mode
// Replace FIREBASE_URL below with your database URL (looks like https://YOUR-PROJECT-default-rtdb.firebaseio.com)
const FIREBASE_URL = 'https://peakgames-80711-default-rtdb.firebaseio.com/players';

// Anonymous session ID
var _pgSid = localStorage.getItem('pg-sid');
if (!_pgSid) { _pgSid = Math.random().toString(36).slice(2, 10); localStorage.setItem('pg-sid', _pgSid); }
const PG_SID = _pgSid;

var pgCurrentGame = null;

function gameKeyFromUrl(url) {
    return (url || '').replace('https://amongusman173-hub.github.io/PeakGames-', '').replace(/\/$/, '').toLowerCase() || null;
}

// Write our session entry
function pgWrite() {
    if (!pgCurrentGame) return;
    fetch(FIREBASE_URL + '/' + PG_SID + '.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: Date.now(), g: pgCurrentGame }),
        keepalive: true
    }).catch(() => {});
}

// Read all sessions and update UI
function pgRead() {
    fetch(FIREBASE_URL + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var now = Date.now();
            var counts = {};
            if (data) {
                Object.keys(data).forEach(function(id) {
                    var e = data[id];
                    if (!e || now - e.t > 120000) return;
                    counts[e.g] = (counts[e.g] || 0) + 1;
                });
            }
            document.querySelectorAll('.player-count').forEach(function(el) {
                var game = el.dataset.game;
                var n = counts[game] || 0;
                if (n > 0) {
                    el.innerHTML = '<span class="player-dot"></span>' + n + ' playing';
                    el.style.display = 'inline-flex';
                } else {
                    el.style.display = 'none';
                }
            });
        })
        .catch(function() {});
}

// Remove our entry on leave
function pgLeave() {
    if (!pgCurrentGame) return;
    fetch(FIREBASE_URL + '/' + PG_SID + '.json', { method: 'DELETE', keepalive: true }).catch(() => {});
}

// Hook into preview toggle (in-page iframe preview) — games.html only
if (typeof window.togglePreview === 'function') {
    const _origToggle = window.togglePreview;
    window.togglePreview = function(event) {
        _origToggle(event);
        const preview = event.target.closest('.game-card').querySelector('.game-preview');
        if (preview.classList.contains('expanded')) {
            pgCurrentGame = gameKeyFromUrl(preview.dataset.src);
            pgWrite();
        } else {
            pgLeave();
            pgCurrentGame = null;
        }
    };
}

// Track "Play Now" clicks — user opened game in new tab, count them as playing
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-play, .btn-primary').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Use data-game attribute if present, otherwise parse the URL
            var key = btn.dataset.game || gameKeyFromUrl(btn.getAttribute('href') || '');
            if (!key) return;
            pgCurrentGame = key;
            localStorage.setItem('pg-playing', JSON.stringify({ g: key, t: Date.now() }));
            pgWrite();
        });
    });

    // On load, resume counting if they were playing something recently (within 30 min)
    var stored = JSON.parse(localStorage.getItem('pg-playing') || 'null');
    if (stored && Date.now() - stored.t < 1800000) {
        pgCurrentGame = stored.g;
        pgWrite();
    }

    pgRead();
    setInterval(pgRead, 5000);
    setInterval(function() { if (pgCurrentGame) pgWrite(); }, 8000);
});

// On tab close: remove Firebase entry but keep localStorage so
// navigating between pages doesn't lose the "playing" state
window.addEventListener('beforeunload', function() {
    pgLeave();
});

// Only clear the stored game if the tab has been idle for 30+ min
// (handled naturally by the 2-min Firebase timeout)

// ── Render recently played on load ──
document.addEventListener('DOMContentLoaded', renderRecentlyPlayed);
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (card.classList.contains('previewing')) return;
            const rect = card.getBoundingClientRect();
            const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * -6;
            const rotateY = (((e.clientX - rect.left) / rect.width) - 0.5) * 6;
            card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = '';
        });
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.12s ease';
        });
    });
});

// ── Page transitions ──
document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !link.target) {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => window.location.href = href, 300);
        });
    }
});

// ════════════════════════════════════════════
// SUGGEST A GAME + MOD PANEL
// ════════════════════════════════════════════

const SUGGEST_DB  = 'https://peakgames-80711-default-rtdb.firebaseio.com/suggestions';
const MOD_PASS    = 'm@ango';
const SPAM_KEY    = 'pg-suggest-last';
const SPAM_LIMIT  = 86400000; // 24 hours in ms

// ── Helpers ──
function openModal(backdropId) {
    var el = document.getElementById(backdropId);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(backdropId) {
    var el = document.getElementById(backdropId);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
}

// Close on backdrop click
['suggestBackdrop','modAuthBackdrop','modPanelBackdrop','modDetailBackdrop'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function(e) {
        if (e.target === el) closeModal(id);
    });
});

// ── Suggest button (navbar + mobile) ──
function openSuggest() {
    // Reset form state
    var form = document.getElementById('suggestForm');
    var succ = document.getElementById('suggestSuccess');
    var err  = document.getElementById('suggestError');
    if (form) form.style.display = 'block';
    if (succ) succ.style.display = 'none';
    if (err)  err.textContent = '';
    var btn = document.getElementById('suggestSubmit');
    if (btn) { btn.disabled = false; btn.textContent = 'Send Suggestion →'; }
    openModal('suggestBackdrop');
}

['suggestFab','suggestFabMobile'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', openSuggest);
});

var suggestClose = document.getElementById('suggestClose');
if (suggestClose) suggestClose.addEventListener('click', function() { closeModal('suggestBackdrop'); });

// ── Canvas Drawing ──
document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('sketchCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var drawing = false;
    var currentColor = '#a78bfa';
    var currentSize = 3;
    var erasing = false;

    function syncCanvas() {
        // Match internal pixel size to CSS display size exactly — no DPR scaling
        var rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return;
        // Save drawing if any
        var img = canvas.toDataURL();
        canvas.width  = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';
        // Restore drawing
        if (img !== 'data:,') {
            var image = new Image();
            image.onload = function() { ctx.drawImage(image, 0, 0); };
            image.src = img;
        }
    }

    // Sync on load and on window resize
    window.addEventListener('resize', syncCanvas);
    setTimeout(syncCanvas, 50); // after layout settles

    function getPos(e) {
        var rect = canvas.getBoundingClientRect();
        var src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left),
            y: (src.clientY - rect.top)
        };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        var p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    }

    function draw(e) {
        e.preventDefault();
        if (!drawing) return;
        var p = getPos(e);
        ctx.lineWidth = currentSize;
        ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
        ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : currentColor;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    }

    function stopDraw() { drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    document.querySelectorAll('.canvas-color').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.canvas-color').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentColor = btn.dataset.color;
            erasing = false;
            var er = document.getElementById('canvasEraser');
            if (er) er.classList.remove('active');
        });
    });

    document.querySelectorAll('.canvas-size').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.canvas-size').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentSize = parseInt(btn.dataset.size);
        });
    });

    var erBtn = document.getElementById('canvasEraser');
    if (erBtn) erBtn.addEventListener('click', function() {
        erasing = !erasing;
        erBtn.classList.toggle('active', erasing);
    });

    var clrBtn = document.getElementById('canvasClear');
    if (clrBtn) clrBtn.addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    var sgDesc = document.getElementById('sgDesc');
    var sgDescCount = document.getElementById('sgDescCount');
    if (sgDesc && sgDescCount) {
        sgDesc.addEventListener('input', function() { sgDescCount.textContent = sgDesc.value.length; });
    }

    // Show/hide custom category input
    var sgCategory = document.getElementById('sgCategory');
    var sgCategoryCustom = document.getElementById('sgCategoryCustom');
    if (sgCategory && sgCategoryCustom) {
        sgCategory.addEventListener('change', function() {
            sgCategoryCustom.style.display = sgCategory.value === 'custom' ? 'block' : 'none';
            if (sgCategory.value === 'custom') sgCategoryCustom.focus();
        });
    }
});

// ── Submit Suggestion ──
var submitBtn = document.getElementById('suggestSubmit');
if (submitBtn) {
    submitBtn.addEventListener('click', function() {
        var name     = (document.getElementById('sgName').value || '').trim();
        var catSelect = document.getElementById('sgCategory');
        var catCustom = document.getElementById('sgCategoryCustom');
        var category = catSelect ? catSelect.value : '';
        if (category === 'custom') {
            category = catCustom ? (catCustom.value || '').trim() : '';
        }
        var desc     = (document.getElementById('sgDesc').value || '').trim();
        var url      = (document.getElementById('sgUrl').value || '').trim();
        var errEl    = document.getElementById('suggestError');
        errEl.textContent = '';

        if (!name)     { errEl.textContent = 'Please enter a game name.'; return; }
        if (!category) { errEl.textContent = 'Please select or enter a category.'; return; }
        if (!desc)     { errEl.textContent = 'Please add a description.'; return; }
        if (url && !/^https?:\/\/.+/.test(url)) { errEl.textContent = 'URL must start with http:// or https://'; return; }

        var last = parseInt(localStorage.getItem(SPAM_KEY) || '0');
        if (Date.now() - last < SPAM_LIMIT) {
            var mins = Math.ceil((SPAM_LIMIT - (Date.now() - last)) / 60000);
            errEl.textContent = 'You can suggest again in ' + (mins > 60 ? Math.ceil(mins/60) + ' hours.' : mins + ' minutes.');
            return;
        }

        var canvas = document.getElementById('sketchCanvas');
        var sketch = null;
        if (canvas) {
            var blank = document.createElement('canvas');
            blank.width = canvas.width; blank.height = canvas.height;
            if (canvas.toDataURL() !== blank.toDataURL()) sketch = canvas.toDataURL('image/png');
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        fetch(SUGGEST_DB + '.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, category: category, desc: desc, url: url || null, sketch: sketch, ts: Date.now(), status: 'pending' })
        })
        .then(function(r) { return r.json(); })
        .then(function() {
            localStorage.setItem(SPAM_KEY, Date.now().toString());
            var form = document.getElementById('suggestForm');
            var succ = document.getElementById('suggestSuccess');
            if (form) form.style.display = 'none';
            if (succ) succ.style.display = 'block';
        })
        .catch(function() {
            errEl.textContent = 'Something went wrong. Please try again.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Suggestion →';
        });
    });
}

// ── Konami Code → Mod Panel ──
(function() {
    var sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
    var idx = 0;
    document.addEventListener('keydown', function(e) {
        if (e.key === sequence[idx]) {
            idx++;
            if (idx === sequence.length) {
                idx = 0;
                // If mod panel elements don't exist, go to suggest.html first
                if (!document.getElementById('modAuthBackdrop')) {
                    window.location.href = 'suggest.html?mod=1';
                    return;
                }
                openModal('modAuthBackdrop');
                setTimeout(function() {
                    var pw = document.getElementById('modPassword');
                    if (pw) { pw.value = ''; pw.focus(); }
                    var ae = document.getElementById('modAuthError');
                    if (ae) ae.textContent = '';
                }, 50);
            }
        } else {
            idx = (e.key === sequence[0]) ? 1 : 0;
        }
    });

    // Auto-open mod auth if redirected here with ?mod=1
    if (window.location.search.indexOf('mod=1') !== -1 && document.getElementById('modAuthBackdrop')) {
        setTimeout(function() {
            openModal('modAuthBackdrop');
            var pw = document.getElementById('modPassword');
            if (pw) { pw.value = ''; pw.focus(); }
        }, 300);
    }
})();

// ── Mod Auth ──
var modAuthClose = document.getElementById('modAuthClose');
if (modAuthClose) modAuthClose.addEventListener('click', function() { closeModal('modAuthBackdrop'); });

function submitModAuth() {
    var pwEl  = document.getElementById('modPassword');
    var errEl = document.getElementById('modAuthError');
    if (!pwEl || !errEl) return;
    if (pwEl.value === MOD_PASS) {
        closeModal('modAuthBackdrop');
        openModal('modPanelBackdrop');
        loadModPanel();
    } else {
        errEl.textContent = 'Incorrect password.';
        pwEl.value = '';
    }
}

var modAuthSubmit = document.getElementById('modAuthSubmit');
if (modAuthSubmit) modAuthSubmit.addEventListener('click', submitModAuth);
var modPwInput = document.getElementById('modPassword');
if (modPwInput) modPwInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitModAuth(); });

// ── Mod Panel ──
var modPanelClose = document.getElementById('modPanelClose');
if (modPanelClose) modPanelClose.addEventListener('click', function() { closeModal('modPanelBackdrop'); });

document.querySelectorAll('.mod-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.mod-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var target = tab.dataset.tab;
        var pend  = document.getElementById('modPending');
        var acc   = document.getElementById('modAccepted');
        var tools = document.getElementById('modTools');
        if (pend)  pend.style.display  = target === 'pending'  ? 'block' : 'none';
        if (acc)   acc.style.display   = target === 'accepted' ? 'block' : 'none';
        if (tools) tools.style.display = target === 'tools'    ? 'block' : 'none';
        if (target === 'tools') updateCooldownStatus();
    });
});

function updateCooldownStatus() {
    var el = document.getElementById('cooldownStatus');
    if (!el) return;
    var last = parseInt(localStorage.getItem(SPAM_KEY) || '0');
    if (!last) {
        el.textContent = '✅ No cooldown active — can suggest now.';
        el.style.color = '#10b981';
    } else {
        var remaining = SPAM_LIMIT - (Date.now() - last);
        if (remaining <= 0) {
            el.textContent = '✅ Cooldown expired — can suggest now.';
            el.style.color = '#10b981';
        } else {
            var hrs  = Math.floor(remaining / 3600000);
            var mins = Math.floor((remaining % 3600000) / 60000);
            el.textContent = '⏱ Cooldown active — ' + (hrs > 0 ? hrs + 'h ' : '') + mins + 'm remaining.';
            el.style.color = '#f59e0b';
        }
    }
}

var resetCooldownBtn = document.getElementById('resetCooldownBtn');
if (resetCooldownBtn) {
    resetCooldownBtn.addEventListener('click', function() {
        localStorage.removeItem(SPAM_KEY);
        updateCooldownStatus();
        resetCooldownBtn.textContent = '✓ Reset!';
        setTimeout(function() { resetCooldownBtn.textContent = 'Reset Cooldown'; }, 2000);
    });
}

function timeAgo(ts) {
    var diff = Date.now() - ts;
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
}

function loadModPanel() {
    fetch(SUGGEST_DB + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var pending = [], accepted = [];
            if (data) {
                Object.keys(data).forEach(function(key) {
                    var item = Object.assign({}, data[key], { _key: key });
                    if (item.status === 'accepted') accepted.push(item);
                    else pending.push(item);
                });
            }
            pending.sort(function(a,b)  { return b.ts - a.ts; });
            accepted.sort(function(a,b) { return b.ts - a.ts; });
            var pc = document.getElementById('pendingCount');
            var ac = document.getElementById('acceptedCount');
            if (pc) pc.textContent = pending.length;
            if (ac) ac.textContent = accepted.length;
            renderModList('pendingList',  pending,  true);
            renderModList('acceptedList', accepted, false);
        })
        .catch(function() {});
}

function renderModList(listId, items, isPending) {
    var list = document.getElementById(listId);
    if (!list) return;
    if (!items.length) { list.innerHTML = '<div class="mod-empty">Nothing here yet.</div>'; return; }
    list.innerHTML = items.map(function(item) {
        var actions = isPending
            ? '<button class="mod-btn mod-btn-view" data-key="' + item._key + '">👁 View</button><button class="mod-btn mod-btn-accept" data-key="' + item._key + '">✓ Accept</button><button class="mod-btn mod-btn-reject" data-key="' + item._key + '">✕ Reject</button>'
            : '<button class="mod-btn mod-btn-view" data-key="' + item._key + '">👁 View</button>';
        return '<div class="mod-card"><div class="mod-card-info"><div class="mod-card-name">' + escHtml(item.name) + '</div><div class="mod-card-meta"><span>' + escHtml(item.category) + '</span><span>' + timeAgo(item.ts) + '</span>' + (item.sketch ? '<span>🎨 sketch</span>' : '') + '</div><div class="mod-card-desc">' + escHtml(item.desc) + '</div></div><div class="mod-card-actions">' + actions + '</div></div>';
    }).join('');
    list.querySelectorAll('.mod-btn-accept').forEach(function(btn) {
        btn.addEventListener('click', function() { modAction(btn.dataset.key, 'accept'); });
    });
    list.querySelectorAll('.mod-btn-reject').forEach(function(btn) {
        btn.addEventListener('click', function() { modAction(btn.dataset.key, 'reject'); });
    });
    list.querySelectorAll('.mod-btn-view').forEach(function(btn) {
        btn.addEventListener('click', function() { openModDetail(btn.dataset.key, items); });
    });
}

function modAction(key, action) {
    var url = action === 'reject'
        ? SUGGEST_DB + '/' + key + '.json'
        : SUGGEST_DB + '/' + key + '/status.json';
    var opts = action === 'reject'
        ? { method: 'DELETE' }
        : { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify('accepted') };
    fetch(url, opts).then(function() { loadModPanel(); }).catch(function() {});
}

function openModDetail(key, items) {
    var item = items.find(function(i) { return i._key === key; });
    if (!item) return;
    var body = document.getElementById('modDetailBody');
    var titleEl = document.getElementById('modDetailTitle');
    if (!body || !titleEl) return;
    titleEl.textContent = item.name;
    body.innerHTML =
        '<div class="mod-detail-field"><div class="mod-detail-label">Category</div><div class="mod-detail-value">' + escHtml(item.category) + '</div></div>' +
        '<div class="mod-detail-field"><div class="mod-detail-label">Description</div><div class="mod-detail-value">' + escHtml(item.desc) + '</div></div>' +
        (item.url ? '<div class="mod-detail-field"><div class="mod-detail-label">URL</div><div class="mod-detail-value"><a href="' + escHtml(item.url) + '" target="_blank" rel="noopener">' + escHtml(item.url) + '</a></div></div>' : '') +
        (item.sketch ? '<div class="mod-detail-field"><div class="mod-detail-label">Concept Sketch</div><img class="mod-detail-canvas" src="' + item.sketch + '" alt="Sketch"></div>' : '') +
        '<div class="mod-detail-field"><div class="mod-detail-label">Submitted</div><div class="mod-detail-value">' + new Date(item.ts).toLocaleString() + '</div></div>' +
        '<div class="mod-detail-actions">' +
            (item.status !== 'accepted'
                ? '<button class="mod-btn mod-btn-accept" id="detailAccept">✓ Accept</button><button class="mod-btn mod-btn-reject" id="detailReject">✕ Reject</button>'
                : '<span style="color:#10b981;font-size:0.85rem;font-weight:600">✓ Already Accepted</span>') +
        '</div>';
    var da = document.getElementById('detailAccept');
    var dr = document.getElementById('detailReject');
    if (da) da.addEventListener('click', function() { modAction(key, 'accept'); closeModal('modDetailBackdrop'); loadModPanel(); });
    if (dr) dr.addEventListener('click', function() { modAction(key, 'reject'); closeModal('modDetailBackdrop'); loadModPanel(); });
    openModal('modDetailBackdrop');
}

var modDetailClose = document.getElementById('modDetailClose');
if (modDetailClose) modDetailClose.addEventListener('click', function() { closeModal('modDetailBackdrop'); });

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
