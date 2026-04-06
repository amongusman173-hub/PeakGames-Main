// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Preview toggle functionality
function togglePreview(gameId) {
    const gameCard = event.target.closest('.game-card');
    const preview = gameCard.querySelector('.game-preview');
    const iframe = preview.querySelector('iframe');
    const button = event.target;
    
    if (preview.classList.contains('expanded')) {
        preview.classList.remove('expanded');
        button.textContent = 'Preview';
        // Reset iframe
        iframe.style.width = '125%';
        iframe.style.height = '125%';
        iframe.style.transform = 'scale(0.8)';
        iframe.style.pointerEvents = 'none';
    } else {
        // Close other expanded previews
        document.querySelectorAll('.game-preview.expanded').forEach(p => {
            p.classList.remove('expanded');
            const otherButton = p.parentElement.querySelector('.btn-preview');
            const otherIframe = p.querySelector('iframe');
            otherButton.textContent = 'Preview';
            otherIframe.style.width = '125%';
            otherIframe.style.height = '125%';
            otherIframe.style.transform = 'scale(0.8)';
            otherIframe.style.pointerEvents = 'none';
        });
        
        preview.classList.add('expanded');
        button.textContent = 'Close Preview';
        // Expand iframe
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.transform = 'scale(1)';
        iframe.style.pointerEvents = 'auto';
    }
}

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('gameSearch');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearch = document.getElementById('clearSearch');
    
    let currentCategory = 'all';
    let currentSearch = '';
    
    // Initialize - make sure all games are visible on load
    gameCards.forEach(card => {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.style.transition = 'all 0.3s ease';
    });
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        filterGames();
        updateClearButton();
    });
    
    // Category button handlers
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.dataset.category;
            filterGames();
        });
    });
    
    // Clear search handler
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        currentCategory = 'all';
        
        // Reset category buttons
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
            
            // Check search match
            const searchMatch = currentSearch === '' || 
                title.includes(currentSearch) || 
                description.includes(currentSearch) ||
                categories.includes(currentSearch);
            
            // Check category match
            const categoryMatch = currentCategory === 'all' || 
                categories.includes(currentCategory);
            
            // Show/hide card with immediate effect
            if (searchMatch && categoryMatch) {
                card.style.display = 'block';
                // Force reflow to ensure display change takes effect
                card.offsetHeight;
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    if (card.style.opacity === '0') {
                        card.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        // Update results count
        resultsCount.textContent = `${visibleCount} game${visibleCount !== 1 ? 's' : ''} found`;
        
        // Show no results message
        showNoResultsMessage(visibleCount === 0);
    }
    
    function updateClearButton() {
        if (currentSearch !== '' || currentCategory !== 'all') {
            clearSearch.style.display = 'inline';
        } else {
            clearSearch.style.display = 'none';
        }
    }
    
    function showNoResultsMessage(show) {
        let noResultsMsg = document.querySelector('.no-results-message');
        
        if (show && !noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <div class="no-results-content">
                    <div class="no-results-icon">🎮</div>
                    <h3>No games found</h3>
                    <p>Try adjusting your search or category filter</p>
                </div>
            `;
            document.querySelector('.games-grid').appendChild(noResultsMsg);
        } else if (!show && noResultsMsg) {
            noResultsMsg.remove();
        }
    }
    
    // Initial filter to ensure everything is visible
    filterGames();
});

// Observe game cards for animation - removed to fix visibility issues
// Games are now immediately visible on page load

// Add loading states for iframes
document.querySelectorAll('iframe').forEach(iframe => {
    const container = iframe.parentElement;
    const loader = document.createElement('div');
    loader.className = 'iframe-loader';
    loader.innerHTML = '<div class="spinner"></div><p>Loading game preview...</p>';
    container.appendChild(loader);
    
    // Set a timeout for loading
    const loadTimeout = setTimeout(() => {
        if (loader.parentElement) {
            loader.innerHTML = '<div class="load-error">Preview unavailable<br><small>Click "Play Now" to access the game</small></div>';
        }
    }, 10000);
    
    iframe.addEventListener('load', () => {
        clearTimeout(loadTimeout);
        setTimeout(() => {
            if (loader.parentElement) {
                loader.remove();
            }
        }, 500);
    });
    
    iframe.addEventListener('error', () => {
        clearTimeout(loadTimeout);
        loader.innerHTML = '<div class="load-error">Preview unavailable<br><small>Click "Play Now" to access the game</small></div>';
    });
});

// Add CSS for loader
const loaderStyles = `
.iframe-loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(17, 17, 17, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 10px;
}

.iframe-loader p {
    color: #ccc;
    margin-top: 1rem;
    font-size: 0.9rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(102, 126, 234, 0.3);
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.load-error {
    text-align: center;
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
}

.load-error small {
    color: #999;
    font-size: 0.8rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = loaderStyles;
document.head.appendChild(styleSheet);