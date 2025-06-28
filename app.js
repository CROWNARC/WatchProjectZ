// DOM Elements
const showsContainer = document.getElementById('shows-container');
const doraemonContainer = document.getElementById('doraemon-container');
const shinchanContainer = document.getElementById('shinchan-container');
const pokemonContainer = document.getElementById('pokemon-container');
const myListContainer = document.getElementById('my-list-container');
const emptyListMessage = document.getElementById('empty-list-message');
const moviePlayer = document.getElementById('movie-player');
const playerTitle = document.getElementById('player-title');
const closePlayer = document.getElementById('close-player');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const videoContainer = document.getElementById('video-container');
const requestForm = document.getElementById('request-form');
const moviesLink = document.getElementById('movies-link');
const newLink = document.getElementById('new-link');
const listLink = document.getElementById('list-link');
const movieContainers = document.querySelectorAll('.movies-container');
const myListSection = document.getElementById('my-list');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchBtn = document.getElementById('search-btn');
const newestContainer = document.getElementById('newest-container');
const recommendationsContainer = document.getElementById('recommendations-container');
const startWatchingBtn = document.getElementById('start-watching-btn');
const userProfile = document.getElementById('user-profile');
const userDashboard = document.getElementById('user-dashboard');
const closeDashboard = document.getElementById('close-dashboard');
const dashboardOverlay = document.getElementById('dashboard-overlay');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const dashboardBtn = document.getElementById('dashboard-btn');
const statsMovies = document.getElementById('stats-movies');
const statsHours = document.getElementById('stats-hours');
const statsLists = document.getElementById('stats-lists');
const embeddedPlayer = document.getElementById('embedded-player');
const altSourceContainer = document.getElementById('alt-source-container');
const altSourceLink = document.getElementById('alt-source-link');
const sourceSwitcher = document.getElementById('source-switcher');
const sourceButtons = document.querySelectorAll('.source-btn');
const toast = document.getElementById('toast');
const DOWNLOADS_ENABLED = false;  

// Initialize data
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
let timeSpent = parseInt(localStorage.getItem('timeSpent')) || 0;
let startTime = Date.now();
let currentMovie = null;

// Get all movies
const allMovies = getAllMovies();

// Migrate watchHistory if old structure exists
if (watchHistory.length > 0 && watchHistory[0].videoId !== undefined) {
    watchHistory = watchHistory.map(item => ({ id: item.id, date: item.date }));
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
}

// Update time spent every 30 seconds
setInterval(() => {
    const currentTime = Date.now();
    const sessionTime = Math.floor((currentTime - startTime) / 1000);
    timeSpent += sessionTime;
    localStorage.setItem('timeSpent', timeSpent);
    startTime = currentTime;
    
    // Update dashboard if open
    if (userDashboard.classList.contains('open')) {
        updateDashboardStats();
    }
}, 30000);

// Show toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Play movie based on source
function playMovie(source, movie) {
      // ─── feature‑flag download block ─────────────────────────────
  if (!DOWNLOADS_ENABLED && 
      (source.type === 'drive' || source.type === 'mediafire' || source.type === 'mega')) {
    // reuse your toast/not‑found UI
    showToast(
      "Downloads are temporarily disabled. We'll have them back soon!",
      "warning"
    );
    return;
  }
  // ─────────────────────────────────────────────────────────────
    embeddedPlayer.style.display = 'none';
    altSourceContainer.style.display = 'none';
    
    if (source.type === 'dailymotion') {
        embeddedPlayer.src = `https://www.dailymotion.com/embed/video/${source.id}?autoplay=1`;
        embeddedPlayer.style.display = 'block';
        addToWatchHistory(movie);
    } else if (source.type === 'youtube') {
        embeddedPlayer.src = `https://www.youtube.com/embed/${source.id}?autoplay=1`;
        embeddedPlayer.style.display = 'block';
        addToWatchHistory(movie);
    } else if (source.type === 'facebook') {
        embeddedPlayer.src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(source.url)}`;
        embeddedPlayer.style.display = 'block';
        addToWatchHistory(movie);
    } else {
        altSourceLink.href = source.url;
        altSourceLink.textContent = source.type === 'drive' 
            ? 'Open in Google Drive' 
            : source.type === 'mediafire' 
            ? 'Download from Mediafire'
            : source.type === 'mega'
            ? 'Download from Mega'
            : 'Download';
        altSourceContainer.style.display = 'block';
    }
}

// Switch player source
function switchSource(type, movie) {
    // Reset all buttons
    sourceButtons.forEach(btn => btn.classList.remove('active'));
    
    // Activate clicked button
    const activeBtn = document.querySelector(`.source-btn[data-type="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Find the source
    let source = null;
    
    if (type === 'dailymotion' || type === 'youtube' || type === 'facebook') {
        source = movie.watchSources.find(s => s.type === type);
    } else {
        source = movie.downloadSources.find(s => s.type === type);
    }
    
    if (source) {
        playMovie(source, movie);
    } else {
        showToast(`This source is not available. It may be added in the future.`, 'warning');
    }
}

// Render shows
function renderShows() {
    showsContainer.innerHTML = '';
    showsData.forEach(show => {
        const showCard = document.createElement('div');
        showCard.className = 'show-card';
        showCard.setAttribute('data-category', show.id);
        showCard.innerHTML = `
            <div class="show-poster">
                <img src="${show.poster}" alt="${show.title}">
            </div>
            <div class="show-info">
                <h3>${show.title}</h3>
                <p class="movies-count">${show.moviesCount}</p>
                <a href="#" class="show-btn">View Movies</a>
            </div>
        `;
        showsContainer.appendChild(showCard);
    });
}

// Create movie card element
function createMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.setAttribute('data-id', movie.id);
    
    movieCard.innerHTML = `
        ${movie.isNew ? '<div class="badge">New</div>' : ''}
        <div class="movie-poster">
            <img src="${movie.poster}" alt="${movie.title}">
        </div>
        <div class="movie-info">
            <h3>${movie.title}</h3>
            <div class="genre"><i class="fas fa-tag"></i> ${movie.genre}</div>
            <div class="rating">
                <i class="fas fa-star"></i>
                <span>${movie.rating}</span>
            </div>
            <div class="action-row">
                <a href="#" class="watch-btn" data-id="${movie.id}">Watch Now</a>
                <button class="favorite-btn ${favorites.includes(movie.id) ? 'active' : ''}">
                    <i class="${favorites.includes(movie.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    return movieCard;
}

// Render movies for a category
function renderMovies(category, container) {
    container.innerHTML = '';
    moviesData[category].forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
}

// Render all movies
function renderAllMovies() {
    renderMovies('doraemon', doraemonContainer);
    renderMovies('shinchan', shinchanContainer);
    renderMovies('pokemon', pokemonContainer);
}

// Render newest movies
function renderNewestMovies() {
    newestContainer.innerHTML = '';
    
    // Get exactly 4 newest movies from each category
    const newestDoraemon = moviesData.doraemon.slice(0, 4);
    const newestShinchan = moviesData.shinchan.slice(0, 4);
    const newestPokemon = moviesData.pokemon.slice(0, 2);
    
    const newestMovies = [
        ...newestDoraemon,
        ...newestShinchan,
        ...newestPokemon
    ];
    
    // Render them
    newestMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        newestContainer.appendChild(movieCard);
    });
}

// Render recommendations (now 12 cards)
function renderRecommendations() {
    recommendationsContainer.innerHTML = '';
    
    // Create a single array of all movies
    const allMovies = [
        ...moviesData.doraemon,
        ...moviesData.shinchan,
        ...moviesData.pokemon
    ];
    
    // Filter out duplicates
    const uniqueMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
    );
    
    // Shuffle array using Fisher-Yates algorithm
    const shuffledMovies = [...uniqueMovies];
    for (let i = shuffledMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledMovies[i], shuffledMovies[j]] = [shuffledMovies[j], shuffledMovies[i]];
    }
    
    // Take first 10
    const recommendedMovies = shuffledMovies.slice(0, 10);
    
    // Render them
    recommendedMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        recommendationsContainer.appendChild(movieCard);
    });
}

// Render My List
function renderMyList() {
    myListContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        emptyListMessage.style.display = 'block';
        return;
    }
    
    emptyListMessage.style.display = 'none';
    
    // Filter favorites
    const favoriteMovies = allMovies.filter(movie => 
        favorites.includes(movie.id)
    );
    
    // Render favorites
    favoriteMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.setAttribute('data-id', movie.id);
        
        movieCard.innerHTML = `
            ${movie.isNew ? '<div class="badge">New</div>' : ''}
            <div class="movie-poster">
                <img src="${movie.poster}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="genre"><i class="fas fa-tag"></i> ${movie.genre}</div>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${movie.rating}</span>
                </div>
                <div class="action-row">
                    <a href="#" class="watch-btn" data-id="${movie.id}">Watch Now</a>
                    <button class="favorite-btn active">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        myListContainer.appendChild(movieCard);
    });
}

// Search movies
function searchMovies(query) {
    if (!query) {
        searchResults.style.display = 'none';
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const results = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(lowerQuery)
    );
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = '';
    results.forEach(movie => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}">
            <div class="search-result-info">
                <h4>${movie.title}</h4>
                <p>${movie.genre}</p>
            </div>
        `;
        resultItem.addEventListener('click', () => {
            playerTitle.textContent = movie.title;
            currentMovie = movie;
            
            // Play primary source (Dailymotion) if available
            const primarySource = movie.watchSources.find(s => s.type === 'dailymotion');
            if (primarySource) {
                playMovie(primarySource, movie);
                // Set active button
                sourceButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector('.source-btn[data-type="dailymotion"]').classList.add('active');
            } else if (movie.watchSources.length > 0) {
                // Play first available source if no Dailymotion
                playMovie(movie.watchSources[0], movie);
                sourceButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.source-btn[data-type="${movie.watchSources[0].type}"]`).classList.add('active');
            } else {
                // Show download sources if no watch sources
                altSourceContainer.style.display = 'block';
            }
            
            moviePlayer.classList.add('active');
            searchResults.style.display = 'none';
            searchInput.value = '';
            moviePlayer.scrollIntoView({ behavior: 'smooth' });
        });
        searchResults.appendChild(resultItem);
    });
    searchResults.style.display = 'block';
}

// Add to watch history
function addToWatchHistory(movie) {
    // Check if already in history
    const existingIndex = watchHistory.findIndex(item => item.id === movie.id);
    
    // If exists, remove it so we can add it to the top
    if (existingIndex !== -1) {
        watchHistory.splice(existingIndex, 1);
    }
    
    // Add to the beginning of history
    watchHistory.unshift({
        id: movie.id,
        date: new Date().toISOString()
    });
    
    // Keep only the last 10 items
    if (watchHistory.length > 10) {
        watchHistory.pop();
    }
    
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    
    // Update dashboard if open
    if (userDashboard.classList.contains('open')) {
        renderDashboard();
    }
}

// Initialize search functionality
function initSearch() {
    searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim()) {
            searchMovies(searchInput.value);
        } else {
            searchResults.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', () => {
        searchMovies(searchInput.value);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

// Event delegation for show cards
showsContainer.addEventListener('click', (e) => {
    const showCard = e.target.closest('.show-card');
    if (!showCard) return;
    
    e.preventDefault();
    const category = showCard.getAttribute('data-category');
    
    // Hide all movie containers
    movieContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Show selected category
    document.getElementById(`${category}-movies`).classList.add('active');
    
    // Scroll to movies section
    document.querySelector('.featured-movies').scrollIntoView({
        behavior: 'smooth'
    });
});

// Event delegation for watch buttons
document.addEventListener('click', (e) => {
    const watchBtn = e.target.closest('.watch-btn');
    if (watchBtn) {
        e.preventDefault();
        
        // Get movie info
        const movieId = watchBtn.getAttribute('data-id');
        const movie = allMovies.find(m => m.id === movieId);
        if (!movie) return;
        
        currentMovie = movie;
        
        // Set player content
        playerTitle.textContent = movie.title;
        
        // Play primary source (Dailymotion) if available
        const primarySource = movie.watchSources.find(s => s.type === 'dailymotion');
        if (primarySource) {
            playMovie(primarySource, movie);
            // Set active button
            sourceButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('.source-btn[data-type="dailymotion"]').classList.add('active');
        } else if (movie.watchSources.length > 0) {
            // Play first available source if no Dailymotion
            playMovie(movie.watchSources[0], movie);
            sourceButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.source-btn[data-type="${movie.watchSources[0].type}"]`).classList.add('active');
        } else if (movie.downloadSources.length > 0) {
            // Show first download source if no watch sources
            altSourceLink.href = movie.downloadSources[0].url;
            altSourceLink.textContent = movie.downloadSources[0].type === 'drive' 
                ? 'Open in Google Drive' 
                : movie.downloadSources[0].type === 'mediafire' 
                ? 'Download from Mediafire'
                : 'Download from Mega';
            altSourceContainer.style.display = 'block';
            embeddedPlayer.style.display = 'none';
        }
        
        // Show player
        moviePlayer.classList.add('active');
        
        // Scroll to player
        moviePlayer.scrollIntoView({
            behavior: 'smooth'
        });
    }
    
    // Continue watching button in dashboard
    const continueBtn = e.target.closest('.continue-btn');
    if (continueBtn) {
        e.preventDefault();
        const movieId = continueBtn.getAttribute('data-id');
        
        // Find movie object
        const movie = allMovies.find(m => m.id === movieId);
        if (movie) {
            playerTitle.textContent = movie.title;
            currentMovie = movie;
            
            // Play primary source
            const primarySource = movie.watchSources.find(s => s.type === 'dailymotion');
            if (primarySource) {
                playMovie(primarySource, movie);
                sourceButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector('.source-btn[data-type="dailymotion"]').classList.add('active');
            } else if (movie.watchSources.length > 0) {
                playMovie(movie.watchSources[0], movie);
                sourceButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.source-btn[data-type="${movie.watchSources[0].type}"]`).classList.add('active');
            }
            
            moviePlayer.classList.add('active');
            moviePlayer.scrollIntoView({ behavior: 'smooth' });
            userDashboard.classList.remove('open');
            dashboardOverlay.style.display = 'none';
            document.body.classList.remove('dashboard-open');
        }
    }
});

// Source switcher event listeners
sourceSwitcher.addEventListener('click', (e) => {
    const sourceBtn = e.target.closest('.source-btn');
    if (sourceBtn && currentMovie) {
        const sourceType = sourceBtn.getAttribute('data-type');
        switchSource(sourceType, currentMovie);
    }
});

// Event delegation for favorite buttons
document.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.favorite-btn');
    if (favoriteBtn) {
        const movieCard = favoriteBtn.closest('.movie-card');
        const movieId = movieCard.getAttribute('data-id');
        
        // Toggle favorite
        const index = favorites.indexOf(movieId);
        if (index === -1) {
            favorites.push(movieId);
        } else {
            favorites.splice(index, 1);
        }
        
        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Update all instances of this movie card
        const allMovieCards = document.querySelectorAll(`.movie-card[data-id="${movieId}"]`);
        allMovieCards.forEach(card => {
            const favBtn = card.querySelector('.favorite-btn');
            if (favBtn) {
                favBtn.classList.toggle('active', favorites.includes(movieId));
                const icon = favBtn.querySelector('i');
                if (favorites.includes(movieId)) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            }
        });
        
        // If we're in My List, update it
        if (myListSection.classList.contains('active')) {
            renderMyList();
        }
        
        // Update dashboard if open
        if (userDashboard.classList.contains('open')) {
            renderDashboard();
        }
    }
});

// Close player
closePlayer.addEventListener('click', (e) => {
    e.preventDefault();
    moviePlayer.classList.remove('active');
    embeddedPlayer.src = '';
    altSourceContainer.style.display = 'none';
    currentMovie = null;
});

// Fullscreen functionality
fullscreenBtn.addEventListener('click', () => {
    if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
    } else if (videoContainer.mozRequestFullScreen) { /* Firefox */
        videoContainer.mozRequestFullScreen();
    } else if (videoContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) { /* IE/Edge */
        videoContainer.msRequestFullscreen();
    }
});

// Form submission
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(requestForm);
    const email = formData.get('email');
    const title = formData.get('title');
    
    // In a real app, this would send to a server
    showToast(`Thank you for your request! We'll consider adding "${title}" to our collection.`, 'info');
    requestForm.reset();
});

// Navigation links
moviesLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Show the first movies container
    movieContainers.forEach(container => container.classList.remove('active'));
    document.getElementById('doraemon-movies').classList.add('active');
    
    document.querySelector('.featured-movies').scrollIntoView({
        behavior: 'smooth'
    });
});

newLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('newest-section').scrollIntoView({ behavior: 'smooth' });
});

listLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Hide all movie containers
    movieContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Show My List
    myListSection.classList.add('active');
    renderMyList();
    
    // Scroll to section
    document.querySelector('.featured-movies').scrollIntoView({
        behavior: 'smooth'
    });
});

// Start watching button
startWatchingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('featured-shows').scrollIntoView({
        behavior: 'smooth'
    });
});

// User dashboard
dashboardBtn.addEventListener('click', () => {
    document.body.classList.add('dashboard-open');
    userDashboard.classList.add('open');
    dashboardOverlay.style.display = 'block';
    renderDashboard();
});

// Add event listener for user profile icon
userProfile.addEventListener('click', () => {
    document.body.classList.add('dashboard-open');
    userDashboard.classList.add('open');
    dashboardOverlay.style.display = 'block';
    renderDashboard();
});

closeDashboard.addEventListener('click', () => {
    document.body.classList.remove('dashboard-open');
    userDashboard.classList.remove('open');
    dashboardOverlay.style.display = 'none';
});

dashboardOverlay.addEventListener('click', () => {
    document.body.classList.remove('dashboard-open');
    userDashboard.classList.remove('open');
    dashboardOverlay.style.display = 'none';
});

// Update dashboard stats
function updateDashboardStats() {
    const moviesCount = watchHistory.length;
    const favoritesCount = favorites.length;
    const hoursWatched = Math.floor(timeSpent / 3600);
    
    statsMovies.textContent = moviesCount;
    statsHours.textContent = hoursWatched;
    statsLists.textContent = favoritesCount;
}

// Enhanced dashboard rendering with new card layout
function renderDashboard() {
    // Update stats
    updateDashboardStats();
    
    // Clear existing content
    historyList.innerHTML = '';
    
    // Get history movies
    const historyMovies = watchHistory.map(entry => {
        const movie = allMovies.find(m => m.id === entry.id);
        return movie ? { ...movie, date: entry.date } : null;
    }).filter(Boolean);
    
    // Render watch history
    if (historyMovies.length > 0) {
        historyMovies.forEach(movie => {
            const historyItem = document.createElement('div');
            historyItem.className = 'dashboard-card glass-effect';
            historyItem.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}">
                <div class="card-content">
                    <h4>${movie.title}</h4>
                    <div class="meta">
                        <i class="fas fa-star"></i> ${movie.rating || '7.5/10'}
                        <span class="watch-date">${formatDate(movie.date)}</span>
                    </div>
                    <button class="continue-btn" data-id="${movie.id}">
                        <i class="fas fa-play-circle"></i> Continue
                    </button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    } else {
        historyList.innerHTML = `
            <div class="empty-message">
                <i class="far fa-clock"></i>
                <h4>No Watch History</h4>
                <p>Movies you watch will appear here</p>
            </div>
        `;
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderShows();
    renderAllMovies();
    renderNewestMovies();
    renderRecommendations();
    renderMyList();
    initSearch();
    
    // Initialize with Doraemon movies visible
    document.getElementById('doraemon-movies').classList.add('active');
    
    // Only show welcome notification if it hasn't been shown before
    if (!localStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            window.addNotification("Welcome to ProjectZ!", "Explore our collection of anime movies and series");
            localStorage.setItem('welcomeShown', 'true');
        }, 5000);
    }
});