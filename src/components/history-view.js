/**
 * @file history-view.js
 * This component is responsible for displaying a history of the user's
 * completed workouts. It fetches the workout data from the backend and
 * renders it as a list with data visualizations.
 */

import { LitElement, html } from "lit";
import { getData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
// import "../style.css"; // This line is removed to fix the loading error

class HistoryView extends LitElement {
  static properties = {
    workouts: { type: Array },
    filteredWorkouts: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    chartInstances: { type: Object },
    expandedWorkouts: { type: Object },
    searchTerm: { type: String },
    filterTerm: { type: String },
    groupBy: { type: String },
    units: { type: String },
  };

  constructor() {
    super();
    this.workouts = [];
    this.filteredWorkouts = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.chartInstances = {};
    this.expandedWorkouts = {};
    this.searchTerm = "";
    this.filterTerm = "all";
    this.groupBy = "workout";
    this.units = 'lbs';
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.fetchWorkoutHistory();
    window.addEventListener('units-change', (e) => this._handleUnitsChange(e.detail.units));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up charts when the component is removed
    Object.values(this.chartInstances).forEach(chart => chart.destroy());
    window.removeEventListener('units-change', this._handleUnitsChange.bind(this));
  }
  
  _handleUnitsChange(units) {
    this.units = units;
    this.requestUpdate();
    this.createCharts();
  }

  async fetchWorkoutHistory() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }

      const response = await getData(token);
      if (response && response.data && response.data.workouts) {
        // Sort workouts by date, newest to oldest for display
        const sortedWorkouts = response.data.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.workouts = sortedWorkouts;
        this.filteredWorkouts = this._applyFilters();
        this.isLoading = false;
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch workout history:", error);
      this.errorMessage =
        "Failed to load your workout history. Please try again.";
      this.isLoading = false;
    }
  }

  _getExerciseIcon(category) {
    // A simple mapping for now. Can be expanded later.
    const icons = {
      'strength': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14 2L6 2v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V2zM14 2h6l-6 6a4 4 0 0 0-4-4V2zM14 2h6L14 8a4 4 0 0 0-4-4V2z"></path></svg>`,
      'cardio': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM12 2a9.5 9.5 0 0 0 0 19M12 2a9.5 9.5 0 0 0 0 19zM12 2a9.5 9.5 0 0 0 0 19z"></path></svg>`,
      'flexibility': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 2v10l-4-4"></path></svg>`,
      'default': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`
    };
    return icons[category] || icons['default'];
  }

  _convertWeight(weight) {
    if (this.units === 'kg') {
      return (weight * 0.453592).toFixed(1);
    }
    return weight;
  }
  
  updated(changedProperties) {
    if (changedProperties.has('workouts') || changedProperties.has('filteredWorkouts') || changedProperties.has('units')) {
      this.createCharts();
    }
  }

  // Epley formula for 1RM estimation
  _calculate1RM(weight, reps) {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  _calculateVolume(exercises) {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.completedSets.reduce((sum, set) => {
        return sum + (set.reps * set.weight);
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }
  
  _processDataForCharts() {
    const exerciseData = {};
    const personalRecords = {};
    const unitLabel = this.units === 'lbs' ? 'lbs' : 'kg';

    this.workouts.forEach(workout => {
      const workoutDate = new Date(workout.date).toLocaleDateString();
      workout.exercises.forEach(exercise => {
        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = {
            labels: [],
            data: [],
          };
        }
        
        let dailyMax1RM = 0;
        exercise.completedSets.forEach(set => {
          const estimated1RM = this._calculate1RM(set.weight, set.reps);
          if (estimated1RM > dailyMax1RM) {
            dailyMax1RM = estimated1RM;
          }

          // Update personal records
          if (!personalRecords[exercise.name] || estimated1RM > personalRecords[exercise.name].oneRepMax) {
            personalRecords[exercise.name] = {
              oneRepMax: Math.round(this._convertWeight(estimated1RM)),
              weight: this._convertWeight(set.weight),
              reps: set.reps,
              date: workoutDate,
            };
          }
        });

        if (dailyMax1RM > 0) {
          exerciseData[exercise.name].labels.push(workoutDate);
          exerciseData[exercise.name].data.push(this._convertWeight(dailyMax1RM));
        }
      });
    });

    return { exerciseData, personalRecords };
  }

  createCharts() {
    const { exerciseData } = this._processDataForCharts();
    const unitLabel = this.units === 'lbs' ? 'lbs' : 'kg';
    
    Object.values(this.chartInstances).forEach(chart => chart.destroy());
    this.chartInstances = {};

    for (const exerciseName in exerciseData) {
      const canvas = this.shadowRoot.querySelector(`#chart-${exerciseName.replace(/\s+/g, '-')}`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        this.chartInstances[exerciseName] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: exerciseData[exerciseName].labels,
            datasets: [{
              label: `Estimated 1RM (${unitLabel})`,
              data: exerciseData[exerciseName].data,
              borderColor: 'rgba(138, 43, 226, 1)',
              backgroundColor: 'rgba(138, 43, 226, 0.2)',
              fill: true,
              tension: 0.1,
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `Est. 1RM: ${Math.round(context.raw)} ${unitLabel}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: `Est. 1RM (${unitLabel})`
                }
              }
            }
          }
        });
      }
    }
  }

  _handleSearch(e) {
    this.searchTerm = e.target.value.toLowerCase();
    this.filteredWorkouts = this._applyFilters();
  }

  _handleFilter(e) {
    this.filterTerm = e.target.value;
    this.filteredWorkouts = this._applyFilters();
  }

  _handleGroupBy(e) {
    this.groupBy = e.target.value;
    this.filteredWorkouts = this._applyFilters();
  }

  _applyFilters() {
    let tempWorkouts = this.workouts;

    if (this.searchTerm) {
      tempWorkouts = tempWorkouts.map(workout => ({
        ...workout,
        exercises: workout.exercises.filter(exercise =>
          exercise.name.toLowerCase().includes(this.searchTerm)
        )
      })).filter(workout => workout.exercises.length > 0);
    }

    if (this.filterTerm !== "all") {
      tempWorkouts = tempWorkouts.map(workout => ({
        ...workout,
        exercises: workout.exercises.filter(exercise =>
          exercise.category === this.filterTerm
        )
      })).filter(workout => workout.exercises.length > 0);
    }
    
    return tempWorkouts;
  }
  
  _toggleExpand(index) {
    this.expandedWorkouts = {
      ...this.expandedWorkouts,
      [index]: !this.expandedWorkouts[index]
    };
  }
  
  _formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  }
  
  _groupAndRenderWorkouts() {
    const weightUnit = this.units === 'lbs' ? 'lbs' : 'kg';
    if (this.groupBy === "workout") {
      return this.filteredWorkouts.map((workout, workoutIndex) => html`
        <div class="card workout-card" @click=${() => this._toggleExpand(workoutIndex)}>
          <div class="workout-summary">
            <h3 class="workout-name">${workout.name}</h3>
            <span class="workout-date">${new Date(workout.date).toLocaleDateString()}</span>
          </div>
          <div class="workout-details ${this.expandedWorkouts[workoutIndex] ? 'expanded' : 'collapsed'}">
            <div class="workout-metrics">
              <p>Total Volume: ${this._convertWeight(this._calculateVolume(workout.exercises))} ${weightUnit}</p>
              <p>Duration: ${this._formatDuration(workout.durationInSeconds)}</p>
            </div>
            ${workout.exercises.map(exercise => html`
              <div class="exercise-item">
                <div class="exercise-header">
                  <div class="exercise-title-group">
                    <span class="exercise-icon">${this._getExerciseIcon(exercise.category)}</span>
                    <h4 class="exercise-name">${exercise.name}</h4>
                  </div>
                </div>
                <ul class="set-list">
                  ${exercise.completedSets.map((set, setIndex) => html`
                    <li class="set-item">Set ${setIndex + 1}: ${set.reps} reps @ ${this._convertWeight(set.weight)} ${weightUnit}</li>
                  `)}
                </ul>
              </div>
            `)}
          </div>
        </div>
      `);
    } else if (this.groupBy === "muscle-group") {
      // Group exercises by muscle group
      const exercisesByMuscleGroup = {};
      this.filteredWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (!exercisesByMuscleGroup[exercise.muscleGroup]) {
            exercisesByMuscleGroup[exercise.muscleGroup] = [];
          }
          exercisesByMuscleGroup[exercise.muscleGroup].push({
            date: new Date(workout.date).toLocaleDateString(),
            completedSets: exercise.completedSets,
            category: exercise.category,
            name: exercise.name,
          });
        });
      });
      
      return Object.keys(exercisesByMuscleGroup).map(muscleGroup => html`
        <div class="card workout-card" @click=${() => this._toggleExpand(muscleGroup)}>
          <div class="workout-summary">
            <h3 class="workout-name">${muscleGroup}</h3>
            <span class="workout-count">(${exercisesByMuscleGroup[muscleGroup].length} exercises)</span>
          </div>
          <div class="workout-details ${this.expandedWorkouts[muscleGroup] ? 'expanded' : 'collapsed'}">
            ${exercisesByMuscleGroup[muscleGroup].map(exercise => html`
              <div class="exercise-item">
                <h4 class="exercise-name">
                  <span class="exercise-icon">${this._getExerciseIcon(exercise.category)}</span>
                  ${exercise.name} on ${exercise.date}
                </h4>
                <ul class="set-list">
                  ${exercise.completedSets.map((set, setIndex) => html`
                    <li class="set-item">Set ${setIndex + 1}: ${set.reps} reps @ ${this._convertWeight(set.weight)} ${weightUnit}</li>
                  `)}
                </ul>
              </div>
            `)}
          </div>
        </div>
      `);
    }
    return html``;
  }

  render() {
    if (this.isLoading) {
      return this.renderSkeleton();
    }

    if (this.errorMessage) {
      return html`
        <div class="container error-container">
          <p class="error-message">${this.errorMessage}</p>
          <button @click=${this.fetchWorkoutHistory} class="btn-primary">Retry</button>
        </div>
      `;
    }

    const { exerciseData, personalRecords } = this._processDataForCharts();
    const uniqueCategories = [...new Set(this.workouts.flatMap(w => w.exercises.map(e => e.category)))];

    return html`
      <div class="container">
        <h1>Workout History</h1>
        ${this.workouts.length > 0
          ? html`
              <div class="summary-card glass-card">
                <h3>Workout Summary</h3>
                <p>You have logged <strong>${this.workouts.length}</strong> workouts.</p>
              </div>

              <div class="filter-controls glass-card">
                <div class="input-group">
                  <label for="search-bar" class="sr-only">Search</label>
                  <input
                    id="search-bar"
                    type="text"
                    placeholder="Search exercises..."
                    @input=${this._handleSearch}
                    .value=${this.searchTerm}
                  />
                </div>
                <div class="input-group">
                  <label for="filter-select">Filter:</label>
                  <select id="filter-select" @change=${this._handleFilter}>
                    <option value="all">All Categories</option>
                    ${uniqueCategories.map(cat => html`<option value="${cat}">${cat}</option>`)}
                  </select>
                </div>
                <div class="input-group">
                  <label for="group-by-select">Group by:</label>
                  <select id="group-by-select" @change=${this._handleGroupBy}>
                    <option value="workout">Workout</option>
                    <option value="muscle-group">Muscle Group</option>
                  </select>
                </div>
              </div>

              ${this._groupAndRenderWorkouts()}

              <h2 class="section-title">Strength Progress</h2>
              ${Object.keys(exerciseData).map(exerciseName => html`
              <div class="card workout-card">
                <div class="exercise-header">
                  <div class="exercise-title-group">
                    <span class="exercise-icon">${this._getExerciseIcon(this.workouts[0].exercises.find(e => e.name === exerciseName)?.category || 'default')}</span>
                    <h2>${exerciseName}</h2>
                  </div>
                </div>
                <div class="personal-record">
                  <strong>Personal Record:</strong> 
                  ${personalRecords[exerciseName] 
                    ? `${personalRecords[exerciseName].weight} ${this.units} x ${personalRecords[exerciseName].reps} reps (Est. 1RM: ${personalRecords[exerciseName].oneRepMax} ${this.units}) on ${personalRecords[exerciseName].date}`
                    : 'No records yet.'
                  }
                </div>
                <canvas id="chart-${exerciseName.replace(/\s+/g, '-')}"></canvas>
              </div>
            `)}`
          : html`<p>You have no workouts logged yet. Start a new workout to see your progress!</p>`}
      </div>
    `;
  }

  renderSkeleton() {
    return html`
      <div class="container">
        <h1>Workout History</h1>
        ${[...Array(2)].map(() => html`
          <div class="card">
            <div class="skeleton skeleton-title" style="width: 70%;"></div>
            <div class="skeleton skeleton-text" style="width: 90%; height: 20px; margin-bottom: 1rem;"></div>
            <div class="skeleton skeleton-card" style="height: 200px;"></div>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define("history-view", HistoryView);
