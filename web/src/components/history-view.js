/**
 * @file history-view.js
 * This component is responsible for displaying a history of the user's
 * completed workouts. It fetches the workout data from local storage and
 * renders it as a list with data visualizations.
 */

import { LitElement, html } from "lit";
import { getDataLocally } from "../services/local-storage.js";

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
    this.units = localStorage.getItem('units') || 'lbs';
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.fetchWorkoutHistory();
    window.addEventListener('units-change', (e) => this._handleUnitsChange(e.detail.units));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up charts when the component is removed
    Object.values(this.chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    window.removeEventListener('units-change', this._handleUnitsChange.bind(this));
  }
  
  _handleUnitsChange(units) {
    this.units = units;
    this.requestUpdate();
    // Delay chart recreation to ensure DOM is updated
    setTimeout(() => this.createCharts(), 200);
  }

  async fetchWorkoutHistory() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      const data = getDataLocally();
      if (data && data.workouts && Array.isArray(data.workouts)) {
        // Sort workouts by date, newest to oldest for display
        const sortedWorkouts = data.workouts
          .filter(workout => workout && workout.date && workout.exercises)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        this.workouts = sortedWorkouts;
        this.filteredWorkouts = this._applyFilters();
        this.isLoading = false;
      } else {
        this.workouts = [];
        this.filteredWorkouts = [];
        this.isLoading = false;
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
      'compound': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
      'isolation': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
      'strength': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
      'cardio': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 12.58a9.5 9.5 0 1 1-10.5-9.5"></path><path d="M16 16l-3-3"></path><path d="M14.5 12.5l-3 3"></path></svg>`,
      'flexibility': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="M12 2v10l-4-4"></path></svg>`,
      'default': html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`
    };
    return icons[category] || icons['default'];
  }

  _convertWeight(weight) {
    const numWeight = parseFloat(weight) || 0;
    if (this.units === 'kg') {
      return (numWeight * 0.453592).toFixed(1);
    }
    return numWeight.toString();
  }
  
  updated(changedProperties) {
    if (changedProperties.has('workouts') || changedProperties.has('filteredWorkouts') || changedProperties.has('units')) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => this.createCharts(), 100);
    }
  }

  // Epley formula for 1RM estimation
  _calculate1RM(weight, reps) {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 1;
    if (r === 1) return w;
    return w * (1 + r / 30);
  }

  _calculateVolume(exercises) {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = (exercise.completedSets || []).reduce((sum, set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        return sum + (reps * weight);
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }
  
  _processDataForCharts() {
    const exerciseData = {};
    const personalRecords = {};
    const unitLabel = this.units === 'lbs' ? 'lbs' : 'kg';

    this.workouts.forEach(workout => {
      if (!workout.date || !workout.exercises) return;
      
      const workoutDate = new Date(workout.date).toLocaleDateString();
      (workout.exercises || []).forEach(exercise => {
        if (!exercise.name || !exercise.completedSets || exercise.completedSets.length === 0) return;
        
        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = {
            labels: [],
            data: [],
            volumeData: [],
          };
        }
        
        let dailyMax1RM = 0;
        let dailyVolume = 0;
        (exercise.completedSets || []).forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          if (weight > 0 && reps > 0) {
            const estimated1RM = this._calculate1RM(weight, reps);
            if (estimated1RM > dailyMax1RM) {
              dailyMax1RM = estimated1RM;
            }
            dailyVolume += reps * weight;

            // Update personal records
            if (!personalRecords[exercise.name] || estimated1RM > personalRecords[exercise.name].oneRepMax) {
              personalRecords[exercise.name] = {
                oneRepMax: Math.round(parseFloat(this._convertWeight(estimated1RM))),
                weight: this._convertWeight(weight),
                reps: reps,
                date: workoutDate,
              };
            }
          }
        });

        if (dailyMax1RM > 0) {
          exerciseData[exercise.name].labels.push(workoutDate);
          exerciseData[exercise.name].data.push(parseFloat(this._convertWeight(dailyMax1RM)));
          exerciseData[exercise.name].volumeData.push(parseFloat(this._convertWeight(dailyVolume)));
        }
      });
    });

    return { exerciseData, personalRecords };
  }

  createRenderRoot() {
    return this;
  }

  createCharts() {
    // Only create charts if Chart.js is available and we have data
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, skipping chart creation');
      return;
    }

    if (!this.workouts || this.workouts.length === 0) {
      return;
    }

    const { exerciseData } = this._processDataForCharts();
    const unitLabel = this.units === 'lbs' ? 'lbs' : 'kg';
    
    // Clean up existing charts
    Object.values(this.chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.chartInstances = {};

    for (const exerciseName in exerciseData) {
      const safeExerciseName = exerciseName.replace(/[^a-zA-Z0-9]/g, '-');
      
      // 1RM Chart
      const canvas1RM = this.querySelector(`#chart-1rm-${safeExerciseName}`);
      if (canvas1RM) {
        const ctx = canvas1RM.getContext('2d');
        this.chartInstances[`1rm-${exerciseName}`] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: exerciseData[exerciseName].labels,
            datasets: [{
              label: `Estimated 1RM (${unitLabel})`,
              data: exerciseData[exerciseName].data,
              borderColor: 'var(--color-accent-primary)',
              backgroundColor: 'rgba(0, 212, 255, 0.2)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'var(--color-accent-primary)',
              pointBorderColor: 'var(--color-surface-secondary)',
              pointHoverRadius: 8,
              pointHoverBackgroundColor: 'var(--color-accent-primary-hover)',
              pointHoverBorderColor: 'var(--color-text-primary)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'var(--color-surface-secondary)',
                titleColor: 'var(--color-text-primary)',
                bodyColor: 'var(--color-text-secondary)',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                callbacks: {
                  label: (context) => {
                    return `Est. 1RM: ${Math.round(context.raw)} ${unitLabel}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: 'var(--border-color)'
                },
                ticks: {
                  color: 'var(--color-text-secondary)'
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: `Est. 1RM (${unitLabel})`,
                  color: 'var(--color-text-secondary)'
                },
                grid: {
                  color: 'var(--border-color)'
                },
                ticks: {
                  color: 'var(--color-text-secondary)'
                }
              }
            }
          }
        });
      }

      // Volume Chart
      const canvasVolume = this.querySelector(`#chart-volume-${safeExerciseName}`);
      if (canvasVolume) {
        const ctx = canvasVolume.getContext('2d');
        this.chartInstances[`volume-${exerciseName}`] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: exerciseData[exerciseName].labels,
            datasets: [{
              label: `Total Volume (${unitLabel})`,
              data: exerciseData[exerciseName].volumeData,
              backgroundColor: 'rgba(0, 212, 255, 0.6)',
              borderColor: 'var(--color-accent-primary)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'var(--color-surface-secondary)',
                titleColor: 'var(--color-text-primary)',
                bodyColor: 'var(--color-text-secondary)',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                callbacks: {
                  label: (context) => {
                    return `Volume: ${Math.round(context.raw)} ${unitLabel}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: 'var(--border-color)'
                },
                ticks: {
                  color: 'var(--color-text-secondary)'
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: `Total Volume (${unitLabel})`,
                  color: 'var(--color-text-secondary)'
                },
                grid: {
                  color: 'var(--border-color)'
                },
                ticks: {
                  color: 'var(--color-text-secondary)'
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
    let tempWorkouts = [...this.workouts];

    if (this.searchTerm) {
      tempWorkouts = tempWorkouts.map(workout => ({
        ...workout,
        exercises: (workout.exercises || []).filter(exercise =>
          exercise.name && exercise.name.toLowerCase().includes(this.searchTerm)
        )
      })).filter(workout => workout.exercises.length > 0);
    }

    if (this.filterTerm !== "all") {
      tempWorkouts = tempWorkouts.map(workout => ({
        ...workout,
        exercises: (workout.exercises || []).filter(exercise =>
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
            <h3 class="workout-name">${workout.name || 'Workout Session'}</h3>
            <span class="workout-date">${new Date(workout.date).toLocaleDateString()}</span>
          </div>
          <div class="workout-details ${this.expandedWorkouts[workoutIndex] ? 'expanded' : 'collapsed'}">
            <div class="workout-metrics">
              <p>Total Volume: ${this._convertWeight(this._calculateVolume(workout.exercises))} ${weightUnit}</p>
              <p>Duration: ${this._formatDuration(workout.durationInSeconds || 0)}</p>
            </div>
            ${(workout.exercises || []).map(exercise => html`
              <div class="exercise-item">
                <div class="exercise-header">
                  <div class="exercise-title-group">
                    <span class="exercise-icon">${this._getExerciseIcon(exercise.category)}</span>
                    <h4 class="exercise-name">${exercise.name}</h4>
                  </div>
                </div>
                <ul class="set-list">
                  ${(exercise.completedSets || []).map((set, setIndex) => html`
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
        (workout.exercises || []).forEach(exercise => {
          const group = exercise.muscleGroup || 'general';
          if (!exercisesByMuscleGroup[group]) {
            exercisesByMuscleGroup[group] = [];
          }
          exercisesByMuscleGroup[group].push({
            date: new Date(workout.date).toLocaleDateString(),
            completedSets: exercise.completedSets || [],
            category: exercise.category,
            name: exercise.name,
          });
        });
      });
      
      return Object.keys(exercisesByMuscleGroup).map(muscleGroup => html`
        <div class="card workout-card" @click=${() => this._toggleExpand(muscleGroup)}>
          <div class="workout-summary">
            <h3 class="workout-name">${muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}</h3>
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
  
  _exportData() {
    // Flatten workout data into a CSV format
    const headers = ["date", "workoutName", "exerciseName", "category", "muscleGroup", "setNumber", "reps", "weight_lbs", "weight_kg", "rir"];
    let csvContent = headers.join(",") + "\n";

    this.workouts.forEach(workout => {
      const workoutDate = new Date(workout.date).toLocaleDateString();
      (workout.exercises || []).forEach(exercise => {
        (exercise.completedSets || []).forEach((set, setIndex) => {
          const row = [
            `"${workoutDate}"`,
            `"${workout.name || 'Workout Session'}"`,
            `"${exercise.name}"`,
            `"${exercise.category}"`,
            `"${exercise.muscleGroup}"`,
            setIndex + 1,
            set.reps,
            set.weight,
            (parseFloat(set.weight) * 0.453592).toFixed(1),
            set.rir || 0
          ];
          csvContent += row.join(",") + "\n";
        });
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `workout-data-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
    
    if (this.workouts.length === 0) {
      return html`
        <div class="container empty-state-container">
          <h1>Workout History</h1>
          <div class="card">
            <h3>No Workouts Logged Yet</h3>
            <p>Once you complete a workout, your history and progress charts will appear here.</p>
          </div>
        </div>
      `;
    }

    const { exerciseData, personalRecords } = this._processDataForCharts();
    const uniqueCategories = [...new Set(this.workouts.flatMap(w => (w.exercises || []).map(e => e.category)).filter(Boolean))];
    const uniqueMuscleGroups = [...new Set(this.workouts.flatMap(w => (w.exercises || []).map(e => e.muscleGroup)).filter(Boolean))];

    return html`
      <div class="container">
        <header class="app-header">
          <h1>Workout History</h1>
          <div class="header-actions">
            <button class="icon-btn" @click=${this._exportData} aria-label="Export to CSV">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </button>
          </div>
        </header>

        <div class="card summary-card">
          <h3>Workout Summary</h3>
          <p>You have logged <strong>${this.workouts.length}</strong> workouts.</p>
        </div>

        <div class="card filter-controls">
          <div class="input-group">
            <label for="search-bar">Search:</label>
            <input
              id="search-bar"
              type="text"
              placeholder="Search exercises..."
              @input=${this._handleSearch}
              .value=${this.searchTerm}
            />
          </div>
          <div class="input-group">
            <label for="filter-select">Filter by Category:</label>
            <select id="filter-select" @change=${this._handleFilter}>
              <option value="all">All Categories</option>
              ${uniqueCategories.map(cat => html`<option value="${cat}">${cat}</option>`)}
            </select>
          </div>
          <div class="input-group">
            <label for="group-by-select">Group by:</label>
            <select id="group-by-select" @change=${this._handleGroupBy}>
              <option value="workout" ?selected=${this.groupBy === 'workout'}>Workout</option>
              <option value="muscle-group" ?selected=${this.groupBy === 'muscle-group'}>Muscle Group</option>
            </select>
          </div>
        </div>

        <div class="history-list">
          ${this._groupAndRenderWorkouts()}
        </div>

        ${Object.keys(exerciseData).length > 0 ? html`
          <h2 class="section-title">Strength Progress</h2>
          ${Object.keys(exerciseData).map(exerciseName => {
            const safeExerciseName = exerciseName.replace(/[^a-zA-Z0-9]/g, '-');
            return html`
            <div class="card progress-card">
              <div class="exercise-header">
                <div class="exercise-title-group">
                  <span class="exercise-icon">${this._getExerciseIcon('strength')}</span>
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
              <div class="chart-container">
                <canvas id="chart-1rm-${safeExerciseName}"></canvas>
                <canvas id="chart-volume-${safeExerciseName}"></canvas>
              </div>
            </div>
          `})}
        ` : ''}
      </div>
    `;
  }

  renderSkeleton() {
    return html`
      <div class="container">
        <h1>Workout History</h1>
        <div class="card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
        <div class="card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
        ${[...Array(2)].map(() => html`
          <div class="card">
            <div class="skeleton skeleton-card-title"></div>
            <div class="skeleton skeleton-text-short"></div>
            <div class="skeleton skeleton-chart-container"></div>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define("history-view", HistoryView);
