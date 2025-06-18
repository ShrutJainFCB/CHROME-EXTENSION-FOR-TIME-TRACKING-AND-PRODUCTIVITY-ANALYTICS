let pieChart = null;

// Helper to format milliseconds into human-readable format HHh MMm SSs
function formatDuration(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return [
    hours > 0 ? `${hours}h` : '',
    minutes > 0 ? `${minutes}m` : '',
    `${seconds}s`
  ].filter(Boolean).join(' ');
}

// Render table rows for the report data
function renderReportRows(data, selectedCategories, reportType) {
  const tbody = document.querySelector('#reportTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-data">No data available for ${reportType} report.</td></tr>`;
    return;
  }

  data.forEach(item => {
    // Calculate total duration filtered by selected categories
    let filteredTotal = 0;
    if (selectedCategories.includes('productive')) filteredTotal += item.productiveDuration;
    if (selectedCategories.includes('unproductive')) filteredTotal += item.unproductiveDuration;
    if (selectedCategories.includes('neutral')) filteredTotal += item.neutralDuration;
    if (selectedCategories.includes('unknown')) filteredTotal += item.unknownDuration;
    if (filteredTotal === 0) return;  // skip rows with no data in selected categories

    let dateLabel = '';
    if (reportType === 'daily') {
      dateLabel = item._id;
    } else if (reportType === 'weekly') {
      dateLabel = `Week ${item._id.week}, ${item._id.year}`;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${dateLabel}</td>
      <td>${formatDuration(item.totalDuration)}</td>
      <td>${selectedCategories.includes('productive') ? formatDuration(item.productiveDuration) : '-'}</td>
      <td>${selectedCategories.includes('unproductive') ? formatDuration(item.unproductiveDuration) : '-'}</td>
      <td>${selectedCategories.includes('neutral') ? formatDuration(item.neutralDuration) : '-'}</td>
      <td>${selectedCategories.includes('unknown') ? formatDuration(item.unknownDuration) : '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// Fetch report data from backend
async function fetchReport(reportType) {
  const response = await fetch(`http://localhost:3000/api/reports/${reportType}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${reportType} report`);
  }
  return response.json();
}

// Render a pie chart with time spent by category
function renderPieChart(data, selectedCategories) {
  let totalProductive = 0, totalUnproductive = 0, totalNeutral = 0, totalUnknown = 0;

  data.forEach(item => {
    totalProductive += item.productiveDuration;
    totalUnproductive += item.unproductiveDuration;
    totalNeutral += item.neutralDuration;
    totalUnknown += item.unknownDuration;
  });

  const labels = [];
  const pieData = [];
  const backgroundColors = [];

  if (selectedCategories.includes('productive') && totalProductive > 0) {
    labels.push('Productive');
    pieData.push(totalProductive);
    backgroundColors.push('#27ae60');
  }
  if (selectedCategories.includes('unproductive') && totalUnproductive > 0) {
    labels.push('Unproductive');
    pieData.push(totalUnproductive);
    backgroundColors.push('#c0392b');
  }
  if (selectedCategories.includes('neutral') && totalNeutral > 0) {
    labels.push('Neutral');
    pieData.push(totalNeutral);
    backgroundColors.push('#f39c12');
  }
  if (selectedCategories.includes('unknown') && totalUnknown > 0) {
    labels.push('Unknown');
    pieData.push(totalUnknown);
    backgroundColors.push('#7f8c8d');
  }

  const ctx = document.getElementById('categoryPieChart').getContext('2d');

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: pieData,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 14 }, color: '#34495e' }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const val = context.parsed;
              const total = context.chart._metasets[context.datasetIndex].total;
              const percent = ((val / total) * 100).toFixed(1);
              return `${context.label}: ${formatDuration(val)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

// Main function to fetch and display the report and pie chart
async function loadReport() {
  const reportType = document.getElementById('report-type').value;

  const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
    .map(el => el.value);

  const tbody = document.querySelector('#reportTable tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="no-data">Loading...</td></tr>`;

  try {
    const data = await fetchReport(reportType);

    renderReportRows(data, selectedCategories, reportType);
    renderPieChart(data, selectedCategories);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-data">Error loading report: ${error.message}</td></tr>`;
    console.error(error);
  }
}

// Setup event listeners for filter controls
function setupControls() {
  document.getElementById('report-type').addEventListener('change', loadReport);

  document.querySelectorAll('.category-filter').forEach(checkbox => {
    checkbox.addEventListener('change', loadReport);
  });
}

// Initialize dashboard on DOM ready
function initDashboard() {
  setupControls();
  loadReport();
}

document.addEventListener('DOMContentLoaded', initDashboard);