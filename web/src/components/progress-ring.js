import { LitElement, html, svg } from "lit";

class ProgressRing extends LitElement {
  static properties = {
    radius: { type: Number },
    stroke: { type: Number },
    progress: { type: Number }, // Progress from 0 to 100
  };

  constructor() {
    super();
    this.radius = 40;
    this.stroke = 8;
    this.progress = 0;
  }

  render() {
    const normalizedRadius = this.radius - this.stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (this.progress / 100) * circumference;

    return html`
      <svg
        height=${this.radius * 2}
        width=${this.radius * 2}
        class="progress-ring"
      >
        <circle
          class="progress-ring__background"
          stroke="var(--color-surface-tertiary)"
          stroke-width=${this.stroke}
          fill="transparent"
          r=${normalizedRadius}
          cx=${this.radius}
          cy=${this.radius}
        />
        <circle
          class="progress-ring__progress"
          stroke="var(--color-accent-primary)"
          stroke-width=${this.stroke}
          stroke-dasharray=${circumference + ' ' + circumference}
          style="stroke-dashoffset:${strokeDashoffset}"
          fill="transparent"
          r=${normalizedRadius}
          cx=${this.radius}
          cy=${this.radius}
        />
      </svg>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define('progress-ring', ProgressRing);
