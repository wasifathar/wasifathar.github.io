// script.js - Modern Interactive Finance Dashboard

// Fetch live stock data from Yahoo Finance API via RapidAPI
async function fetchStockData(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.quoteResponse.result;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return [];
  }
}

// Render stock ticker section
async function renderStockTicker() {
  const tickerContainer = document.getElementById("stock-ticker");
  if (!tickerContainer) return;

  const symbols = ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA", "JPM"];
  const stocks = await fetchStockData(symbols);

  tickerContainer.innerHTML = stocks.map(stock => {
    const changeClass = stock.regularMarketChange >= 0 ? "positive" : "negative";
    return `
      <div class="stock-item ${changeClass}">
        <span class="symbol">${stock.symbol}</span>
        <span class="price">${stock.regularMarketPrice.toFixed(2)}</span>
        <span class="change">${stock.regularMarketChange.toFixed(2)} (${stock.regularMarketChangePercent.toFixed(2)}%)</span>
      </div>
    `;
  }).join("");
}

// Load projects from JSON file
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const response = await fetch("/projects.json");
    const projects = await response.json();
    grid.innerHTML = projects.map(proj => `
      <div class="project-card">
        <h3>${proj.title}</h3>
        <p>${proj.description}</p>
        <div class="tags">
          ${proj.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
        ${proj.link ? `<a href="${proj.link}" target="_blank" class="cta-button">View Project</a>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading projects:", err);
  }
}

// Initialize page
function init() {
  renderStockTicker();
  loadProjects();
  // Refresh stocks every 60 seconds
  setInterval(renderStockTicker, 60000);
}

document.addEventListener("DOMContentLoaded", init);
