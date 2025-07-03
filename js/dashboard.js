import { fetchJSON } from './utils.js'
let globalProducts = [];

async function loadDashboardData() {
  const products = await fetchJSON('/api/products');
  globalProducts = products;
  const sales = await fetchJSON('/api/sales');
  const reviews = await fetchJSON('/api/reviews');
  const analysis = await fetchJSON('/api/dashboard/analysis');
  const avgScores = analysis.avgScores
  const sentiments = analysis.sentiments;

  renderStockSalesChart(globalProducts);
  renderDailySalesChart(sales);
  renderReviewChart(reviews);
  renderAverageScoreChart(products, avgScores);
  renderSentimentChart(products, sentiments);
}

document.addEventListener('DOMContentLoaded', () => {
  const sortBySelect = document.getElementById('sort-by');
  const orderSelect = document.getElementById('select-order');

  if (sortBySelect && orderSelect) {
    const handleSortChange = () => {
      const sortBy = sortBySelect.value;
      const order = orderSelect.value;
      renderStockSalesChart(globalProducts, sortBy, order);
    };

    sortBySelect.addEventListener('change', handleSortChange);
    orderSelect.addEventListener('change', handleSortChange);
  } else {
    console.error('select elements not found!');
  }
});

let chartInstance = null;
function renderStockSalesChart(products, sortBy = 'stock', order = 'desc') {
  products.sort((a, b) => {
    const valA = (typeof a[sortBy] === 'string') ? a[sortBy].toLowerCase() : a[sortBy] || 0;
    const valB = (typeof b[sortBy] === 'string') ? b[sortBy].toLowerCase() : b[sortBy] || 0;
    return order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  if (chartInstance) {
    chartInstance.destroy();
  }
  const ctx = document.getElementById('stockSalesChart').getContext('2d');
  const labels = products.map(p => p.name);
  const soldData = products.map(p => p.sold || 0);
  const stockData = products.map(p => p.stock);
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets:[
        {
          label: 'Sold',
          data: soldData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          stack: 'stock'
        },
        {
          label: 'Stock',
          data: stockData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          stack: 'stock'
        }
      ]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Stock and Sold per Product (sorted by ${sortBy}, ${order})`
        }
      },
      scales : {
        x: {
          stacked: true,
          title: { display: true, text: 'Product' }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'Units'},
          beginAtZero: true
        }
      }
    }
  });
}

function renderDailySalesChart(sales) {
  const dailyTotals = {};
  sales.forEach(s => {
    const date = s.date.split('T')[0];
    const amount = s.price * s.quantity;
    dailyTotals[date] = (dailyTotals[date] || 0) + amount;
  });

  const dateKeys = Object.keys(dailyTotals).sort();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  const endDate = new Date();
  endDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + 1);
  const monthlyMap = {};

  for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    monthlyMap[key] = [];

    const daysInMonth = new Date(yyyy, d.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const fullDate = `${key}-${dd}`;
      const amount = dailyTotals[fullDate] || 0;
      monthlyMap[key].push({ date: fullDate,amount });
    }
  }
  
  const monthSelect = document.getElementById('month-select');
  Object.keys(monthlyMap).forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  let chart;

  function updateChart(month) {
    const data = monthlyMap[month] || [];
    const labels = data.map(d => d.date);
    const amounts = data.map(d => d.amount);
    const total = amounts.reduce((sum, v) => sum + v, 0);

    document.getElementById('monthly-total').textContent = `Total Sales for ${month}: ¥${total.toLocaleString()}`;

    const [year, monthNum] = month.split('-').map(Number);
    const prevMonthDate = new Date(year, monthNum - 2);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const prevData = monthlyMap[prevMonthKey] || [];
    const prevTotal = prevData.reduce((sum, d) => sum + d.amount, 0);
    const diff = total - prevTotal;
    const diffPercent = prevTotal === 0 ? 'N/A' : ((diff / prevTotal) * 100).toFixed(1) + '%';
    const sign = diff >= 0 ? '+' : '';

    document.getElementById('monthly-diff').textContent =
      prevTotal === 0
        ? `No data for previous month (${prevMonthKey})`
        : `Compared to ${prevMonthKey}: ${sign}¥${Math.abs(diff).toLocaleString()} (${sign}${diffPercent})`;

    if (chart) {
      chart.destroy();
    }

    const ctx = document.getElementById('dailySalesChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels, 
        datasets: [{
          label: `Daily Sales for ${month}(¥)`,
          data: amounts,
          fill: false,
          borderColor:'rgba(255, 99, 132, 1)',
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { 
            title: { display: true, text: 'Date' } ,
            ticks: { maxRotation: 90, minRotation: 45}
          },
          y: { 
            title: { display: true, text: 'Sales (¥)'},
            beginAtZero: true
          }
        },
        responsive: true,
        plugins: {
          tooltip: { mode: 'index', intersect: false },
          legend: { display: true }
        }
      }
    });
  }
  const lastMonth = Object.keys(monthlyMap).pop();
  updateChart(lastMonth);
  monthSelect.value = lastMonth;

  monthSelect.addEventListener('change', () => {
    updateChart(monthSelect.value);
  });
}

function renderReviewChart(reviews) {
  const reviewStars = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    if (r.stars >= 1 && r.stars <= 5) {
      reviewStars[r.stars - 1]++;
    }
  });

  const ctx = document.getElementById('reviewChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['★1', '★2', '★3', '★4', '★5'],
      datasets: [{
        label: 'Review Count',
        data: reviewStars,
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }]
    }
  })
}

function renderAverageScoreChart(products, avgScores) {
  const labels = products.map(p => p.name);
  const data = products.map(p => Number(avgScores[p.id]) || 0);

  const ctx = document.getElementById('avgScoreChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets : [{
        label: 'Average Review Score',
        data,
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 5 }
      }
    }
  });
}

function renderSentimentChart(products, sentiments) {
  const labels = products.map(p => p.name);
  const positive = products.map(p => sentiments[p.id]?.positive || 0);
  const negative = products.map(p => sentiments[p.id]?.negative || 0);

  const ctx = document.getElementById('sentimentChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Positive',
          data: positive,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          stack: 'sentiment'
        },
        {
          label: 'Negative',
          data: negative,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          stack: 'sentiment'
        }
      ]
    },
    options: {
      scales:{
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}


window.addEventListener('DOMContentLoaded', loadDashboardData);