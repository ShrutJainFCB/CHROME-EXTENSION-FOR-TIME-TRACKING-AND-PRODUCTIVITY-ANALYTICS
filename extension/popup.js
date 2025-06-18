// Format milliseconds nicely
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// Calculate and update productivity percentage circle
function updateProgressCircle(productive, total) {
  const circle = document.querySelector('.progress');
  const percentText = document.getElementById('percent-text');

  if (total === 0) {
    percentText.textContent = '0%';
    circle.style.strokeDashoffset = 377; // full circumference offset (empty)
    return;
  }

  const percent = Math.min(100, Math.round((productive / total) * 100));
  percentText.textContent = `${percent}%`;

  const circumference = 2 * Math.PI * 60; // circle radius 60
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// Fetch total and productive tracked time from storage
function fetchTrackedTimes() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['totalTrackedTime'], (result) => {
      let total = result.totalTrackedTime || 0;

      // For demo: approximate productive time as 60% of total (replace with real data if available)
      const productive = Math.floor(total * 0.6);
      resolve({ total, productive });
    });
  });
}

// Fetch current active tab URL
function fetchActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      document.getElementById('current-url').textContent = tabs[0].url;
    } else {
      document.getElementById('current-url').textContent = 'No active tab found.';
    }
  });
}

// Initialize color strokeDashoffset for progress circle
function initProgressCircle() {
  const circle = document.querySelector('.progress');
  const circumference = 2 * Math.PI * 60; // radius 60
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;
}

// Initialize popup functionality
async function initPopup() {
  initProgressCircle();
  fetchActiveTab();

  const { total, productive } = await fetchTrackedTimes();

  updateProgressCircle(productive, total);

  const statusText = total > 0
    ? `Tracked: ${formatTime(total)} (Productive: ${formatTime(productive)})`
    : 'Tracking your time spent on websites.';

  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', initPopup);
