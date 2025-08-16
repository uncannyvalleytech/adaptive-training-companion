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
    userCredential: { type: Object },
  };

  constructor() {
    super();
    this.isLoading = true;
    this.userCredential = null; // No user is signed in initially
  }

  // This function runs when the component is first added to the page
  connectedCallback() {
    super.connectedCallback();
    // The Google library is loaded asynchronously, so we wait for it.
    // Once the window is fully loaded, we know the script is available.
    window.onload = () => {
      this.isLoading = false;
    };
  }

  // This function runs after the component's first render
  firstUpdated() {
    if (!this.isLoading) {
      this.setupSignIn();
    }
  }

  // A new function to set up the sign-in button
  setupSignIn() {
    // Find the div we created in our HTML to hold the button
    const signInButtonContainer = this.shadowRoot.querySelector(
      "#google-signin-button"
    );
    if (signInButtonContainer) {
      // Call our service to render the button inside that div
      initializeSignIn(signInButtonContainer, (credential) => {
        this._handleSignIn(credential);
      });
    }
  }

  // This function is called by our auth service after a successful sign-in
  _handleSignIn(credential) {
    this.userCredential = credential;
    console.log("User has been passed to the app shell:", this.userCredential);
  }

  // The `render` function describes what to display on the screen
  render() {
    if (this.isLoading) {
      return html`<p>Loading Application...</p>`;
    }

    // Now, when a user signs in, `this.userCredential` will be updated,
    // and this will automatically re-render to show the home screen.
    return this.userCredential
      ? this.renderHomeScreen()
      : this.renderLoginScreen();
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
    return html`
      <div>
        <h1>Welcome Back!</h1>
        <p>You are now signed in.</p>
        <!-- We will add a sign-out button and more features here later -->
      </div>
    `;
  }
}

// Register our new component with the browser
customElements.define("app-shell", AppShell);
