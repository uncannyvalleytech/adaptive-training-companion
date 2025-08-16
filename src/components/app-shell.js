/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

import { LitElement, html, css } from "lit";
import { initializeSignIn } from "../services/google-auth.js";
// *** NEW: Import our api service ***
import { getData } from "../services/api.js";

class AppShell extends LitElement {
  static properties = {
    userCredential: { type: Object },
    isGoogleLibraryLoaded: { type: Boolean },
  };

  constructor() {
    super();
    this.userCredential = null;
    this.isGoogleLibraryLoaded = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibrary();
  }

  waitForGoogleLibrary() {
    if (window.google && window.google.accounts) {
      this.isGoogleLibraryLoaded = true;
      this.setupSignIn();
    } else {
      setTimeout(() => this.waitForGoogleLibrary(), 100);
    }
  }

  setupSignIn() {
    const signInButtonContainer = this.shadowRoot.querySelector(
      "#google-signin-button"
    );
    if (signInButtonContainer) {
      initializeSignIn(signInButtonContainer, (credential) => {
        this._handleSignIn(credential);
      });
    }
  }

  // This function is called by our auth service after a successful sign-in
  async _handleSignIn(credential) {
    this.userCredential = credential;
    console.log("User signed in. Credential:", this.userCredential);

    // *** NEW: Test the backend connection ***
    console.log("Attempting to fetch data from the backend...");
    // The `credential` object contains the secure token in a property called `credential`.
    const response = await getData(this.userCredential.credential);
    console.log("Response from backend:", response);
  }

  render() {
    return this.userCredential
      ? this.renderHomeScreen()
      : this.renderLoginScreen();
  }

  renderLoginScreen() {
    return html`
      <div>
        <h1>Welcome to the Adaptive Training Companion</h1>
        <p>Please sign in to continue.</p>
        <div id="google-signin-button"></div>
        ${!this.isGoogleLibraryLoaded
          ? html`<p><em>Loading Sign-In button...</em></p>`
          : ""}
      </div>
    `;
  }

  renderHomeScreen() {
    return html`
      <div>
        <h1>Welcome Back!</h1>
        <p>You are now signed in and connected to the backend.</p>
      </div>
    `;
  }
}

customElements.define("app-shell", AppShell);
