/**
 * @file main.js
 * This is the primary entry point for the Adaptive Training Companion application.
 * It is responsible for loading the main application component and attaching it to the webpage.
 */

// We are importing the main app component, which we will create later.
// This line tells our app to load the code for the main user interface.
import "./components/app-shell.js";
// Import the new syncData function from the API service
import { syncData } from "./services/api.js";
// Remove this line: import "./style.css";

console.log("Adaptive Training Companion initialized!");

// Call the new syncData function to handle any queued offline data
syncData();