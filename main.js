/**
 * @file main.js
 * This is the primary entry point for the Adaptive Training Companion application.
 * It is responsible for loading the main application component and attaching it to the webpage.
 */

// IMPORTANT: Define the global function BEFORE importing anything else
// This global function is called by the Google Identity Services library
// once it has fully loaded.
window.onGoogleLibraryLoad = () => {
  console.log("Google Identity Services library has loaded.");
  window.dispatchEvent(new CustomEvent('google-library-loaded'));
};

// We are importing the main app component, which we will create later.
// This line tells our app to load the code for the main user interface.
import "./components/app-shell.js";
// Import the new syncData function and getQueuedWorkoutsCount from the API service
import { syncData, getQueuedWorkoutsCount } from "./services/api.js";

console.log("Adaptive Training Companion initialized!");

// Call the new syncData function to handle any queued offline data
syncData();

// Check for offline data on load and dispatch a custom event
const queuedCount = getQueuedWorkoutsCount();
if (queuedCount > 0) {
  window.dispatchEvent(new CustomEvent('offline-data-queued', {
    detail: { count: queuedCount }
  }));
}
