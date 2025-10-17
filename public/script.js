async function fetchAirQuality() {
  try {
    const res = await fetch("/api/latest");
    const data = await res.json();
    const table = document.getElementById("aq-table");
    table.innerHTML = "";

    data.results.forEach(item => {
      const tr = document.createElement("tr");

      const location = `${item.city}, ${item.country}`;
      const value = parseFloat(item.value.toFixed(2));
      const lastUpdated = new Date(item.lastUpdated).toLocaleTimeString();

      tr.innerHTML = `
        <td>${location}</td>
        <td>${item.parameter.toUpperCase()}</td>
        <td>${value}</td>
        <td>${item.unit}</td>
        <td>${lastUpdated}</td>
      `;

      // Highlight high pollutants
      if (
        (item.parameter === "pm2_5" && value > 35) ||
        (item.parameter === "pm10" && value > 50) ||
        (item.parameter === "co" && value > 100) ||
        (item.parameter === "no2" && value > 40) ||
        (item.parameter === "o3" && value > 100)
      ) {
        tr.classList.add("high");
      }

      table.appendChild(tr);
    });

    // Last refresh timestamp
    const lastRefresh = new Date();
    document.getElementById("last-refresh").textContent = `Last refresh: ${lastRefresh.toLocaleTimeString()}`;
  } catch (err) {
    console.error("Error fetching air quality:", err);
  }
}

// Initial fetch
fetchAirQuality();

// Auto-refresh every 20s
setInterval(fetchAirQuality, 20000);
