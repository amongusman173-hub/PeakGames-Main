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

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    navbar.style.background = window.scrollY > 50
        ? 'rgba(7, 7, 15, 0.98)'
        : 'rgba(7, 7, 15, 0.85)';
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

    // Staggered entrance animation on load
    gameCards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(28px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 80 + i * 80);
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
            const desc = card.dataset.description.toLowerCase();
            const cats = card.dataset.category.toLowerCase();
            const match = (currentSearch === '' || title.includes(currentSearch) || desc.includes(currentSearch) || cats.includes(currentSearch))
                       && (currentCategory === 'all' || cats.includes(currentCategory));

            if (match) {
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
        } else if (!show && msg) msg.remove();
    }

    filterGames();
});

// ── Card tilt VFX ──
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
