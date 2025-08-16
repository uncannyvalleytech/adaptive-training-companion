/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

// Import the necessary parts from the Lit library
import { LitElement, html, css } from "lit";

// Import our authentication service
import { initializeSignIn } from "../services/google-auth.js";

// Define our new custom element
class AppShell extends LitElement {
  // Define the properties that will trigger updates when they change
  static properties = {
    isLoading: { type: Boolean },
    user: { type: Object },
  };

  constructor() {
    super();
    this.isLoading = true; // Start in a loading state
    this.user = null; // No user is signed in initially
  }

  // This function runs when the component is first added to the page
  connectedCallback() {
    super.connectedCallback();
    // We will initialize the Google Sign-In flow here later
    console.log("AppShell connected. Ready to initialize sign-in.");
    // For now, let's pretend loading is finished after a short delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  // The `render` function describes what to display on the screen
  render() {
    if (this.isLoading) {
      return html`<p>Loading Application...</p>`;
    }

    // If we are not loading, we check if a user is signed in.
    // For now, the user is always null, so we show the login view.
    return this.user ? this.renderHomeScreen() : this.renderLoginScreen();
  }

  renderLoginScreen() {
    return html`
      <div>
        <h1>Welcome to the Adaptive Training Companion</h1>
        <p>Please sign in to continue.</p>
        <!-- The Google Sign-In button will be rendered here -->
        <div id="google-signin-button"></div>
      </div>
    `;
  }

  renderHomeScreen() {
    // We will build the main application view here later
    return html`
      <div>
        <h1>Welcome Back!</h1>
        <p>You are signed in.</p>
      </div>
    `;
  }
}

// Register our new component with the browser
customElements.define("app-shell", AppShell);
