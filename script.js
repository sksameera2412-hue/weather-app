// API Key for OpenWeatherMap (replace with your own key)
const API_KEY = 'bb2e040d29406294ea71534618b4ae61';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const dateElement = document.getElementById('date');
const weatherIcon = document.getElementById('weather-icon');
const tempElement = document.getElementById('temp');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const forecastContainer = document.getElementById('forecast-container');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    setCurrentDate();
    
    // Try to get user's location or default to New Delhi
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherDataByCoords(latitude, longitude);
            },
            error => {
                console.error('Error getting location:', error);
                // Default to New Delhi if location access is denied
                getWeatherDataByCity('New Delhi');
            }
        );
    } else {
        // Geolocation not supported
        getWeatherDataByCity('New Delhi');
    }
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
});

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-IN', options);
}

// Handle search
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherDataByCity(city);
    }
}

// Handle location button
function handleLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherDataByCoords(latitude, longitude);
            },
            error => {
                showError('Location access denied. Please search for a city manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Get weather data by city name
async function getWeatherDataByCity(city) {
    try {
        setLoading(true);
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city},in&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found. Please enter a valid Indian city name.');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city},in&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update UI with data
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);
        
        // Clear input and any errors
        searchInput.value = '';
        clearError();
        
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// Get weather data by coordinates
async function getWeatherDataByCoords(lat, lon) {
    try {
        setLoading(true);
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Could not fetch weather data for your location.');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data for your location.');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update UI with data
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);
        
        // Clear any errors
        clearError();
        
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// Update current weather UI
function updateCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    tempElement.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDesc.textContent = data.weather[0].description;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    
    // Update weather icon
    updateWeatherIcon(data.weather[0].icon, data.weather[0].main);
}

// Update forecast UI
function updateForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Filter to get one forecast per day (around noon)
    const dailyForecasts = data.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    ).slice(0, 5);
    
    // Create forecast cards
    dailyForecasts.forEach(day => {
        const forecastDate = new Date(day.dt * 1000);
        const dayName = forecastDate.toLocaleDateString('en-IN', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <h3>${dayName}</h3>
            <i class="${getWeatherIconClass(day.weather[0].icon, day.weather[0].main)}"></i>
            <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
            <div class="forecast-desc">${day.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Update weather icon based on condition
function updateWeatherIcon(iconCode, main) {
    weatherIcon.className = getWeatherIconClass(iconCode, main);
}

// Get appropriate icon class based on weather condition
function getWeatherIconClass(iconCode, main) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-showers-heavy',
        '09n': 'fas fa-cloud-showers-heavy',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    // Fallback based on main weather condition if icon code not found
    return iconMap[iconCode] || getFallbackIcon(main);
}

// Fallback icon based on main weather condition
function getFallbackIcon(main) {
    const fallbackMap = {
        'Clear': 'fas fa-sun',
        'Clouds': 'fas fa-cloud',
        'Rain': 'fas fa-cloud-rain',
        'Drizzle': 'fas fa-cloud-drizzle',
        'Thunderstorm': 'fas fa-bolt',
        'Snow': 'fas fa-snowflake',
        'Mist': 'fas fa-smog',
        'Smoke': 'fas fa-smog',
        'Haze': 'fas fa-smog',
        'Dust': 'fas fa-smog',
        'Fog': 'fas fa-smog',
        'Sand': 'fas fa-smog',
        'Ash': 'fas fa-smog',
        'Squall': 'fas fa-wind',
        'Tornado': 'fas fa-wind'
    };
    
    return fallbackMap[main] || 'fas fa-cloud';
}

// Show error message
function showError(message) {
    // Remove any existing error
    clearError();
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Insert after search container
    const searchContainer = document.querySelector('.search-container');
    searchContainer.parentNode.insertBefore(errorElement, searchContainer.nextSibling);
}

// Clear error message
function clearError() {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}