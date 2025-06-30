import { fetchJSON } from './utils.js'

async function loadDashboardData() {
  const products = await fetchJSON('/api/products');
  const sales = await fetchJSON('/api/sales');
  const reviews = await fetchJSON('/api/reviews');
  const analysis = await fetchJSON('/api/dashboard/analysis');
  const avgScores = analysis.avgScores
  const sentiments = analysis.sentiments;

  renderStockSalesChart(products);
  renderDailySalesChart(sales);
  renderReviewChart(reviews);
  renderAverageScoreChart(products, avgScores);
  renderSentimentChart(products, sentiments);
}

function renderStockSalesChart(products) {
  const ctx = document.getElementById('stockSalesChart').getContext('2d');
  const labels = products.map(p => p.name);
  const soldData = products.map(p => p.sold || 0);
  const stockData = products.map(p => p.stock);
  
  new Chart(ctx, {
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
      plugins: {
        title: {
          display: true,
          text: 'Stock and Sold per Product'
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
  const startDate = new Date(dateKeys[0]);
  const endDate = new Date(dateKeys[dateKeys.length - 1]);

  function generateDateRange(start, end) {
    const result = [];
    const current = new Date(start);
    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() +1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      result.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  const allDates = generateDateRange(startDate, endDate);
  const completeTotals = allDates.map(date => dailyTotals[date] ?? 0);

  const ctx = document.getElementById('dailySalesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: allDates,
      datasets: [{
        label: 'Daily Sales (¥)',
        data: completeTotals,
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