// ── Click sound ──
const clickSound = new Audio('sounds/buttonclick.mp3');
clickSound.volume = 0.4;

function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

document.addEventListener('click', (e) => {
    if (e.target.matches('a, button, .category-btn, .btn-play, .btn-preview, .btn-source, .nav-logo, .nav-links a')) {
        playClick();
    }
});

// ── Background music (starts on first user interaction) ──
const bgMusic = new Audio('sounds/backroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.15;

let musicStarted = false;
document.addEventListener('click', () => {
    if (!musicStarted) {
        bgMusic.play().catch(() => {});
        musicStarted = true;
    }
}, { once: false });

// Music toggle button
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('musicToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
            btn.textContent = '♪';
            btn.classList.remove('muted');
        } else {
            bgMusic.pause();
            btn.textContent = '♪';
            btn.classList.add('muted');
        }
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
// Iframes only load when preview is opened — prevents game audio playing in background
function togglePreview(event) {
    playClick();
    const gameCard = event.target.closest('.game-card');
    const preview = gameCard.querySelector('.game-preview');
    const iframe = preview.querySelector('iframe');
    const button = event.target;

    if (preview.classList.contains('expanded')) {
        // Collapse — blank the src to kill all game audio immediately
        preview.classList.remove('expanded');
        button.textContent = 'Preview';
        iframe.src = 'about:blank';
        iframe.style.pointerEvents = 'none';
        gameCard.classList.remove('previewing');
    } else {
        // Close any other open previews first, killing their audio
        document.querySelectorAll('.game-preview.expanded').forEach(p => {
            p.classList.remove('expanded');
            const otherIframe = p.querySelector('iframe');
            const otherButton = p.parentElement.querySelector('.btn-preview');
            otherIframe.src = 'about:blank';
            otherIframe.style.pointerEvents = 'none';
            otherButton.textContent = 'Preview';
            p.closest('.game-card').classList.remove('previewing');
        });

        // Open — now load the game
        preview.classList.add('expanded');
        button.textContent = 'Close Preview';
        iframe.src = iframe.dataset.src;
        iframe.style.pointerEvents = 'auto';
        gameCard.classList.add('previewing');
    }
}

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(7, 7, 15, 0.98)';
    } else {
        navbar.style.background = 'rgba(7, 7, 15, 0.85)';
    }
});

// ── Search & filter ──
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('gameSearch');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearch = document.getElementById('clearSearch');

    if (!searchInput) return;

    let currentCategory = 'all';
    let currentSearch = '';

    gameCards.forEach(card => {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.style.transition = 'all 0.3s ease';
    });

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
            const description = card.dataset.description.toLowerCase();
            const categories = card.dataset.category.toLowerCase();
            const searchMatch = currentSearch === '' || title.includes(currentSearch) || description.includes(currentSearch) || categories.includes(currentSearch);
            const categoryMatch = currentCategory === 'all' || categories.includes(currentCategory);

            if (searchMatch && categoryMatch) {
                card.style.display = 'block';
                card.offsetHeight;
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
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
        } else if (!show && msg) {
            msg.remove();
        }
    }

    filterGames();
});

// ── Page transitions ──
document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href.startsWith('#') && !href.startsWith('http') && !link.target) {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => window.location.href = href, 300);
        });
    }
});

// ── Cursor glow VFX ──
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
document.body.appendChild(cursorGlow);

document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

// ── Card tilt VFX ──
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -4;
        const rotateY = ((x - cx) / cx) * 4;
        card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease';
    });
});

// ── Loader styles injected ──
const loaderStyles = `
.cursor-glow {
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.06) 0%, transparent 70%);
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9999;
    transition: left 0.08s ease, top 0.08s ease;
}

.game-card.previewing {
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.5), 0 30px 60px rgba(0,0,0,0.6), 0 0 60px rgba(102, 126, 234, 0.12) !important;
    border-color: rgba(102, 126, 234, 0.4) !important;
}

.iframe-loader {
    position: absolute;
    inset: 0;
    background: #0d0d1a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    gap: 1rem;
}

.iframe-loader p { color: #444; font-size: 0.85rem; }

.spinner {
    width: 36px; height: 36px;
    border: 2.5px solid rgba(102, 126, 234, 0.2);
    border-top: 2.5px solid #667eea;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
`;

const styleEl = document.createElement('style');
styleEl.textContent = loaderStyles;
document.head.appendChild(styleEl);
