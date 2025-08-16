/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

import { LitElement, html, css } from "lit";
import { initializeSignIn } from "../services/google-auth.js";

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
    // This function will wait until the Google library is ready.
    this.waitForGoogleLibrary();
  }

  // This function repeatedly checks for the Google library.
  // This is a much more reliable way to handle the timing issue.
  waitForGoogleLibrary() {
    if (window.google && window.google.accounts) {
      this.isGoogleLibraryLoaded = true;
      this.setupSignIn();
    } else {
      // If it's not ready, check again in a moment.
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

  _handleSignIn(credential) {
    this.userCredential = credential;
    console.log("User has been passed to the app shell:", this.userCredential);
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

        <!-- The Google Sign-In button will be rendered here -->
        <div id="google-signin-button"></div>

        <!-- Show a message if the library is slow to load -->
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
        <p>You are now signed in.</p>
      </div>
    `;
  }
}

customElements.define("app-shell", AppShell);
