/**
 * @file main.js
 * Enhanced entry point with better error handling and initialization
 */

// Enhanced error handling for module imports
async function initializeApp() {
  try {
    // Import components with error handling
    console.log("Loading app components...");
    
    await import("./components/app-shell.js").catch(error => {
      console.error("Failed to load app-shell:", error);
      throw new Error("Core app component failed to load");
    });
    
    await import("./components/motivational-elements.js").catch(error => {
      console.warn("Failed to load motivational elements:", error);
      // Non-critical, continue without this component
    });

    console.log("Adaptive Training Companion initialized!");

    // Notify that app is ready
    window.dispatchEvent(new CustomEvent('app-ready'));
    console.log("App initialization complete");

  } catch (error) {
    console.error("Critical app initialization error:", error);
    
    // Display user-friendly error message
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1F2233;
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      z-index: 9999;
      max-width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    errorContainer.innerHTML = `
      <h2 style="margin-bottom: 1rem; color: #ff6b6b;">App Loading Error</h2>
      <p style="margin-bottom: 1.5rem; color: #a9a9b3;">
        There was a problem loading the app. This might be due to network issues or browser compatibility.
      </p>
      <button onclick="window.location.reload()" style="
        background: linear-gradient(135deg, #00FF88, #00D4FF);
        border: none;
        color: #1A1A2E;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      ">
        Retry Loading
      </button>
    `;
    
    document.body.appendChild(errorContainer);
  }
}

// Enhanced global error handling
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Don't prevent default for critical errors, but log them
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('Loading chunk') || 
       event.reason.message.includes('Failed to fetch'))) {
    console.warn('Network-related error detected, app may be offline');
    event.preventDefault(); // Prevent the error from crashing the app
  }
});

window.addEventListener('error', event => {
  console.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Handle script loading errors
  if (event.filename && (event.filename.includes('.js') || event.filename.includes('.mjs'))) {
    console.warn('Script loading error detected:', event.filename);
  }
});

// Network status monitoring
window.addEventListener('online', () => {
  console.log('App is back online');
  window.dispatchEvent(new CustomEvent('app-online'));
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  window.dispatchEvent(new CustomEvent('app-offline'));
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}
