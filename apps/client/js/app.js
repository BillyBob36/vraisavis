const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.vraisavis.fr';

const SYMBOLS = ['🍕', '🍔', '🍰', '🍩', '🍪', '🧁', '☕', '🍷', '🍻', '🎁'];

let state = {
  restaurantId: null,
  restaurant: null,
  fingerprintId: null,
  currentService: null,
  prize: null,
};

// Utils
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function showError(title, message) {
  document.getElementById('error-title').textContent = title;
  document.getElementById('error-message').textContent = message;
  showScreen('error');
}

async function generateFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('// VraisAvis Client Application', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const localId = localStorage.getItem('fb_uid') || crypto.randomUUID();
  localStorage.setItem('fb_uid', localId);
  
  const cookieId = document.cookie.match(/fb_sid=([^;]+)/)?.[1] || crypto.randomUUID();
  document.cookie = `fb_sid=${cookieId}; max-age=7776000; path=/`;
  
  const combined = `${navigator.userAgent}|${canvasData}|${localId}|${cookieId}|${screen.width}x${screen.height}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// API calls
async function api(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }
  
  return data;
}

// Geolocation
async function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      error => {
        let message = 'Erreur de géolocalisation';
        if (error.code === 1) message = 'Veuillez autoriser la géolocalisation';
        if (error.code === 2) message = 'Position non disponible';
        if (error.code === 3) message = 'Délai d\'attente dépassé';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Slot machine
const slots = [
  document.getElementById('slot1'),
  document.getElementById('slot2'),
  document.getElementById('slot3'),
];

function spinSlots() {
  return new Promise(resolve => {
    let intervals = [];
    
    slots.forEach((slot, i) => {
      slot.classList.add('spinning');
      let count = 0;
      const maxSpins = 20 + (i * 10);
      
      intervals[i] = setInterval(() => {
        slot.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        count++;
        
        if (count >= maxSpins) {
          clearInterval(intervals[i]);
          slot.classList.remove('spinning');
          
          if (i === slots.length - 1) {
            setTimeout(resolve, 300);
          }
        }
      }, 100);
    });
  });
}

function setFinalSymbols(won) {
  if (won) {
    const symbol = '🎁';
    slots.forEach(slot => slot.textContent = symbol);
  }
}

// Claim button (long press)
function setupClaimButton() {
  const claimBtn = document.getElementById('claim-btn');
  let pressTimer;
  let isPressed = false;
  let progressInterval;
  
  const startPress = (e) => {
    e.preventDefault();
    isPressed = true;
    claimBtn.classList.add('pressing');
    claimBtn.textContent = 'Maintenir...';
    
    let progress = 0;
    progressInterval = setInterval(() => {
      progress += 100;
      const percent = Math.min((progress / 2000) * 100, 100);
      claimBtn.textContent = `${Math.floor(percent)}%`;
    }, 100);
    
    pressTimer = setTimeout(async () => {
      if (isPressed) {
        clearInterval(progressInterval);
        await claimPrize();
      }
    }, 2000);
  };
  
  const endPress = () => {
    isPressed = false;
    clearTimeout(pressTimer);
    clearInterval(progressInterval);
    claimBtn.classList.remove('pressing');
    claimBtn.textContent = 'Valider le cadeau (maintenir 2s)';
  };
  
  claimBtn.addEventListener('touchstart', startPress);
  claimBtn.addEventListener('mousedown', startPress);
  claimBtn.addEventListener('touchend', endPress);
  claimBtn.addEventListener('mouseup', endPress);
  claimBtn.addEventListener('mouseleave', endPress);
}

async function claimPrize() {
  if (!state.prize?.code) return;
  
  try {
    await api('/api/v1/client/claim', {
      method: 'POST',
      body: JSON.stringify({ code: state.prize.code }),
    });
    
    showScreen('claimed');
  } catch (error) {
    showError('Erreur', error.message);
  }
}

// Main flow
async function init() {
  // Get restaurant ID from URL
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  state.restaurantId = pathParts[0];
  
  if (!state.restaurantId) {
    showError('Erreur', 'Restaurant non trouvé');
    return;
  }
  
  try {
    // Get restaurant info
    const { restaurant } = await api(`/api/v1/client/restaurant/${state.restaurantId}`);
    state.restaurant = restaurant;
    
    // Check geolocation
    showScreen('geolocation');
    
  } catch (error) {
    showError('Erreur', error.message);
  }
}

async function handleGeolocation() {
  try {
    const position = await requestGeolocation();
    
    showScreen('loading');
    
    // Verify location
    const { allowed, message, currentService } = await api('/api/v1/client/verify-location', {
      method: 'POST',
      body: JSON.stringify({
        latitude: position.latitude,
        longitude: position.longitude,
        restaurantId: state.restaurantId,
      }),
    });
    
    if (!allowed) {
      showError('Accès refusé', message);
      return;
    }
    
    state.currentService = currentService;
    
    // Generate and check fingerprint
    const hash = await generateFingerprint();
    const { fingerprintId, canPlay, reason } = await api('/api/v1/client/fingerprint', {
      method: 'POST',
      body: JSON.stringify({ hash, restaurantId: state.restaurantId }),
    });
    
    state.fingerprintId = fingerprintId;
    
    if (!canPlay) {
      showScreen('already-played');
      return;
    }
    
    // Show welcome
    document.getElementById('restaurant-name').textContent = state.restaurant.name;
    if (state.restaurant.welcomeMessage) {
      document.getElementById('welcome-message').textContent = state.restaurant.welcomeMessage;
    }
    showScreen('welcome');
    
  } catch (error) {
    showError('Erreur', error.message);
  }
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  const positive = document.getElementById('positive').value;
  const negative = document.getElementById('negative').value;
  
  try {
    showScreen('loading');
    
    await api('/api/v1/client/feedback', {
      method: 'POST',
      body: JSON.stringify({
        fingerprintId: state.fingerprintId,
        restaurantId: state.restaurantId,
        positiveText: positive,
        negativeText: negative || undefined,
      }),
    });
    
    showScreen('slot-machine');
    
  } catch (error) {
    showError('Erreur', error.message);
  }
}

async function handleSpin() {
  const spinBtn = document.getElementById('spin-btn');
  spinBtn.disabled = true;
  
  try {
    // Start animation
    await spinSlots();
    
    // Get result from API
    const result = await api('/api/v1/client/spin', {
      method: 'POST',
      body: JSON.stringify({
        fingerprintId: state.fingerprintId,
        restaurantId: state.restaurantId,
      }),
    });
    
    if (result.won) {
      setFinalSymbols(true);
      state.prize = result.prize;
      
      setTimeout(() => {
        document.getElementById('prize-name').textContent = result.prize.name;
        document.getElementById('prize-description').textContent = result.prize.description || '';
        document.getElementById('prize-code').textContent = result.prize.code;
        document.getElementById('prize-expires').textContent = new Date(result.prize.expiresAt).toLocaleDateString('fr-FR');
        showScreen('result-win');
      }, 500);
    } else {
      setTimeout(() => {
        if (state.restaurant?.thankYouMessage) {
          document.getElementById('thank-you-message').textContent = state.restaurant.thankYouMessage;
        }
        showScreen('result-lose');
      }, 500);
    }
    
  } catch (error) {
    showError('Erreur', error.message);
  }
}

// Event listeners
document.getElementById('geo-btn').addEventListener('click', handleGeolocation);
document.getElementById('start-btn').addEventListener('click', () => showScreen('feedback'));
document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmit);
document.getElementById('spin-btn').addEventListener('click', handleSpin);

// Setup
setupClaimButton();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// Init
init();
