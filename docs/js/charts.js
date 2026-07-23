let areaChart = null;
let pieChart  = null;

// ── Trend: Buy vs Sell submissions over the last 6 months ──────
export function renderAreaChart(buyForm, sellForm) {
  const canvas = document.getElementById("areaChart");
  if (!canvas) return;

  const months     = last6Months();
  const buyCounts  = countByMonth(buyForm,  months);
  const sellCounts = countByMonth(sellForm, months);

  if (areaChart) areaChart.destroy();
  areaChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: "Buy",
          data: buyCounts,
          borderColor: "#34d399",
          backgroundColor: gradient("#34d399"),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#34d399",
          pointRadius: 3,
        },
        {
          label: "Sell",
          data: sellCounts,
          borderColor: "#f59e0b",
          backgroundColor: gradient("#f59e0b"),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#f59e0b",
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { color: "#94a3b8", boxWidth: 10, padding: 12, font: { size: 11 } },
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#4a5568" } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#4a5568", precision: 0 }, beginAtZero: true },
      },
    },
  });
}

// ── Breakdown: share of submissions by collection type ─────────
export function renderPieChart(counts) {
  const canvas = document.getElementById("pieChart");
  if (!canvas) return;

  const entries = [
    ["Buy",           counts.buy,           "#34d399"],
    ["Sell",          counts.sell,          "#f59e0b"],
    ["Properties",    counts.properties,    "#4f8ef7"],
    ["Members",       counts.members,       "#a78bfa"],
    ["Registrations", counts.registrations, "#94a3b8"],
    ["Building Info", counts.buildingInfo,  "#f472b6"],
  ].filter(([, v]) => v > 0);

  if (pieChart) pieChart.destroy();
  if (!entries.length) return;

  pieChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: entries.map(e => e[0]),
      datasets: [{
        data: entries.map(e => e[1]),
        backgroundColor: entries.map(e => e[2]),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 10, padding: 10 },
        },
      },
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────
function last6Months() {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }
  return out;
}

function countByMonth(items, months) {
  return months.map(({ year, month }) =>
    items.filter(item => {
      const d = item.createdAt?.toDate ? item.createdAt.toDate() : null;
      return d && d.getFullYear() === year && d.getMonth() === month;
    }).length
  );
}

function gradient(hex) {
  return (ctx) => {
    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, hexToRgba(hex, 0.3));
    g.addColorStop(1, hexToRgba(hex, 0));
    return g;
  };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}