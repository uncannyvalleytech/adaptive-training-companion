/**
 * @file main.js
 * This is the primary entry point for the Adaptive Training Companion application.
 */

// Import components and services
import "./components/app-shell.js";
import "./components/motivational-elements.js"; // Add this line
import { syncData, getQueuedWorkoutsCount } from "./services/api.js";
import { initializeGapi } from "./services/google-auth.js";

console.log("Adaptive Training Companion initialized!");

// Make initializeGapi available globally for the HTML script
window.initializeGapi = initializeGapi;

// Call the syncData function to handle any queued offline data
syncData();

// Check for offline data on load and dispatch a custom event
const queuedCount = getQueuedWorkoutsCount();
if (queuedCount > 0) {
  window.dispatchEvent(new CustomEvent('offline-data-queued', {
    detail: { count: queuedCount }
  }));
}

// Enhanced error handling
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the error from crashing the app
});

window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});
