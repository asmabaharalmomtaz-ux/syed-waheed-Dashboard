import { escapeHtml } from "./utils.js";

// ────────────────────────────────────────────────────────────────
// Media Library — Phase 1 (UI only, mock data, no Cloudflare/R2)
// ────────────────────────────────────────────────────────────────

// ── Deterministic pseudo-random (so mock data is stable across renders) ──
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260724);
const pick = arr => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ── Folder tree (as shown in the left panel) ──────────────────────
export const FOLDER_TREE = [
  {
    id: "properties", label: "Properties", icon: "🏘️",
    children: [
      { id: "properties-for-sale", label: "For Sale", icon: "🏷️" },
      { id: "properties-rentals",  label: "Rentals",  icon: "🔑" },
      { id: "properties-offplan",  label: "Off Plan", icon: "🏗️" },
    ],
  },
  { id: "areas",      label: "Areas",      icon: "📍" },
  { id: "developers", label: "Developers", icon: "🏢" },
  { id: "agents",     label: "Agents",     icon: "🧑‍💼" },
  { id: "logos",      label: "Logos",      icon: "🎯" },
  { id: "banners",    label: "Banners",    icon: "🖼️" },
  { id: "blog",       label: "Blog",       icon: "📰" },
];

const FOLDER_META = {
  "properties-for-sale": { path: "properties/for-sale", crumb: "Properties / For Sale" },
  "properties-rentals":  { path: "properties/rentals",  crumb: "Properties / Rentals" },
  "properties-offplan":  { path: "properties/off-plan", crumb: "Properties / Off Plan" },
  "areas":       { path: "areas",       crumb: "Areas" },
  "developers":  { path: "developers",  crumb: "Developers" },
  "agents":      { path: "agents",      crumb: "Agents" },
  "logos":       { path: "logos",       crumb: "Logos" },
  "banners":     { path: "banners",     crumb: "Banners" },
  "blog":        { path: "blog",        crumb: "Blog" },
};

function folderDisplayLabel(folderId) {
  return (FOLDER_META[folderId] && FOLDER_META[folderId].crumb) || folderId;
}

// ── Mock data source pools ─────────────────────────────────────────
const AREAS = [
  "Dubai Marina", "Business Bay", "Palm Jumeirah", "Downtown Dubai", "Jumeirah Village Circle",
  "Dubai Hills Estate", "Arabian Ranches", "Al Barsha", "DIFC", "Dubai Creek Harbour",
  "Bluewaters Island", "City Walk", "Jumeirah Beach Residence", "Emirates Hills", "Al Furjan",
];
const DEVELOPERS = ["Emaar", "DAMAC", "Sobha", "Nakheel", "Meraas", "Azizi", "Ellington", "Binghatti", "Danube", "Dubai Properties"];
const AGENT_NAMES = [
  "Sarah Khan", "Omar Al Farsi", "Layla Haddad", "James Whitmore", "Fatima Noor",
  "Ahmed Siddiqui", "Elena Petrova", "Michael Chen", "Noura Al Ali", "Ravi Shankar",
];
const PROPERTY_SHOTS = ["villa", "penthouse", "living-room", "skyline", "night", "pool", "exterior", "balcony", "aerial", "lobby", "kitchen", "bedroom"];
const OFFPLAN_PROJECTS = ["Hartland", "Creek Vista", "Beach Residences", "Central Park", "Estates", "Greens", "Waves", "Reserve"];
const RESOLUTIONS = [[1920, 1080], [2000, 1333], [1600, 1200], [1280, 853], [2400, 1600], [1200, 800], [1000, 1000]];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatMediaDate(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function randomRecentDate(maxDaysAgo = 220) {
  const anchor = new Date(2026, 6, 24); // "today" in this app's mock timeline
  return new Date(anchor.getTime() - randInt(0, maxDaysAgo) * 86400000);
}

// ── Mock data generator (~80 realistic records) ────────────────────
function generateMockMedia() {
  const images = [];
  let counter = 1;

  function addImage({ folder, filename, width, height, sizeBytes }) {
    const id = `media-${String(counter++).padStart(3, "0")}`;
    const meta = FOLDER_META[folder];
    images.push({
      id, filename, folder, width, height,
      size: sizeBytes,
      uploadedAt: randomRecentDate(),
      thumbnail: `https://picsum.photos/seed/${id}/480/360`,
      cdnUrl: `https://media.waheedproperty.com/${meta.path}/${filename}`,
    });
  }

  for (let i = 0; i < 20; i++) {
    const area = pick(AREAS), shot = pick(PROPERTY_SHOTS);
    const filename = rand() > 0.5
      ? `${slugify(area)}-${shot}.webp`
      : `${slugify(area)}-${String(randInt(1, 12)).padStart(2, "0")}.webp`;
    const [w, h] = pick(RESOLUTIONS);
    addImage({ folder: "properties-for-sale", filename, width: w, height: h, sizeBytes: randInt(280, 4600) * 1024 });
  }

  for (let i = 0; i < 14; i++) {
    const area = pick(AREAS), shot = pick(PROPERTY_SHOTS);
    const filename = `${slugify(area)}-${shot}-${String(randInt(1, 9)).padStart(2, "0")}.webp`;
    const [w, h] = pick(RESOLUTIONS);
    addImage({ folder: "properties-rentals", filename, width: w, height: h, sizeBytes: randInt(250, 3800) * 1024 });
  }

  for (let i = 0; i < 10; i++) {
    const dev = pick(DEVELOPERS), proj = pick(OFFPLAN_PROJECTS);
    const filename = `${slugify(dev)}-${slugify(proj)}-${String(randInt(1, 6)).padStart(2, "0")}.webp`;
    const [w, h] = pick(RESOLUTIONS);
    addImage({ folder: "properties-offplan", filename, width: w, height: h, sizeBytes: randInt(300, 5200) * 1024 });
  }

  for (let i = 0; i < 12; i++) {
    const area = pick(AREAS), tag = pick(["skyline", "aerial", "street-view", "waterfront", "sunset"]);
    const filename = `${slugify(area)}-${tag}.webp`;
    const [w, h] = pick(RESOLUTIONS);
    addImage({ folder: "areas", filename, width: w, height: h, sizeBytes: randInt(400, 4200) * 1024 });
  }

  for (let i = 0; i < 9; i++) {
    const dev = pick(DEVELOPERS);
    const isLogo = i < 4;
    const filename = isLogo ? `${slugify(dev)}-logo.png` : `${slugify(dev)}-hq-office.webp`;
    const [w, h] = isLogo ? [512, 512] : pick(RESOLUTIONS);
    addImage({ folder: "developers", filename, width: w, height: h, sizeBytes: isLogo ? randInt(20, 180) * 1024 : randInt(400, 3200) * 1024 });
  }

  for (let i = 0; i < 8; i++) {
    const name = AGENT_NAMES[i % AGENT_NAMES.length];
    addImage({ folder: "agents", filename: `agent-${slugify(name)}.jpg`, width: randInt(800, 1000), height: randInt(1000, 1300), sizeBytes: randInt(180, 900) * 1024 });
  }

  ["emaar-logo.png", "waheed-property-logo.svg", "damac-logo.png"].forEach(filename => {
    addImage({ folder: "logos", filename, width: 512, height: 512, sizeBytes: randInt(15, 120) * 1024 });
  });

  ["downtown-banner.webp", "ramadan-offer-banner.webp", "summer-campaign-banner.webp"].forEach(filename => {
    addImage({ folder: "banners", filename, width: 1600, height: 600, sizeBytes: randInt(300, 900) * 1024 });
  });

  addImage({ folder: "blog", filename: "blog-cover-market-update.webp", width: 1600, height: 900, sizeBytes: randInt(300, 1200) * 1024 });

  return images;
}

// ── Module state ─────────────────────────────────────────────────
let mediaData      = null;
let selectedFolder = "all";
let searchQuery    = "";
let viewMode       = "grid";

function ensureData() {
  if (!mediaData) mediaData = generateMockMedia();
}

// ── Entry point — called from app.js when the Media view opens ────
export function renderMediaLibrary() {
  ensureData();
  renderToolbar();
  renderFolderSidebar();
  renderMainContent();
}

// ── Toolbar (search / view toggle / refresh / upload) ──────────────
function renderToolbar() {
  const el = document.getElementById("media-toolbar");
  if (!el) return;
  el.innerHTML = `
    <div class="media-toolbar">
      <div class="media-toolbar-left">
        <input id="media-search" class="filter-input" placeholder="🔍  Search filename or folder..." value="${escapeHtml(searchQuery)}"/>
      </div>
      <div class="media-toolbar-right">
        <div class="view-toggle">
          <button id="media-view-grid" class="view-toggle-btn ${viewMode === "grid" ? "active" : ""}" title="Grid view">▦</button>
          <button id="media-view-list" class="view-toggle-btn ${viewMode === "list" ? "active" : ""}" title="List view">☰</button>
        </div>
        <button id="media-refresh-btn" class="media-btn media-btn-secondary">⟳&nbsp; Refresh</button>
        <button id="media-upload-btn" class="media-btn media-btn-primary" disabled title="Coming in Phase 2">⬆&nbsp; Upload Images</button>
      </div>
    </div>`;

  document.getElementById("media-search").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderMainContent();
  });
  document.getElementById("media-view-grid").addEventListener("click", () => setViewMode("grid"));
  document.getElementById("media-view-list").addEventListener("click", () => setViewMode("list"));
  document.getElementById("media-refresh-btn").addEventListener("click", e => {
    const btn = e.currentTarget;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "⟳&nbsp; Refreshing…";
    setTimeout(() => {
      renderMainContent();
      btn.innerHTML = original;
      btn.disabled = false;
    }, 450);
  });
}

function setViewMode(mode) {
  viewMode = mode;
  document.getElementById("media-view-grid")?.classList.toggle("active", mode === "grid");
  document.getElementById("media-view-list")?.classList.toggle("active", mode === "list");
  renderMainContent();
}

// ── Folder sidebar ──────────────────────────────────────────────
function computeCounts() {
  const counts = {};
  mediaData.forEach(img => { counts[img.folder] = (counts[img.folder] || 0) + 1; });
  counts.properties = (counts["properties-for-sale"] || 0) + (counts["properties-rentals"] || 0) + (counts["properties-offplan"] || 0);
  counts.all = mediaData.length;
  return counts;
}

function renderFolderSidebar() {
  const el = document.getElementById("media-folder-sidebar");
  if (!el) return;
  const counts = computeCounts();

  const itemHtml = (folder, depth = 0) => {
    const active = selectedFolder === folder.id ? "active" : "";
    const childrenHtml = folder.children ? folder.children.map(c => itemHtml(c, depth + 1)).join("") : "";
    return `
      <div class="folder-item ${active}" data-folder="${folder.id}" style="padding-left:${14 + depth * 16}px">
        <span class="folder-icon">${folder.icon}</span>
        <span class="folder-label">${escapeHtml(folder.label)}</span>
        <span class="folder-count">${counts[folder.id] || 0}</span>
      </div>
      ${childrenHtml}`;
  };

  el.innerHTML = `
    <div class="folder-sidebar">
      <div class="folder-item ${selectedFolder === "all" ? "active" : ""}" data-folder="all" style="padding-left:14px">
        <span class="folder-icon">🗂️</span>
        <span class="folder-label">All Media</span>
        <span class="folder-count">${counts.all}</span>
      </div>
      ${FOLDER_TREE.map(f => itemHtml(f)).join("")}
    </div>`;

  el.querySelectorAll(".folder-item").forEach(node => {
    node.addEventListener("click", () => {
      selectedFolder = node.dataset.folder;
      renderFolderSidebar();
      renderMainContent();
    });
  });
}

// ── Main content (grid / list) ──────────────────────────────────
function getFilteredImages() {
  let list = mediaData;
  if (selectedFolder !== "all") {
    list = selectedFolder === "properties"
      ? list.filter(img => img.folder.startsWith("properties-"))
      : list.filter(img => img.folder === selectedFolder);
  }
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(img =>
      img.filename.toLowerCase().includes(q) ||
      folderDisplayLabel(img.folder).toLowerCase().includes(q)
    );
  }
  return [...list].sort((a, b) => b.uploadedAt - a.uploadedAt);
}

function renderMainContent() {
  const el = document.getElementById("media-main");
  if (!el) return;
  const images = getFilteredImages();

  if (!images.length) {
    el.innerHTML = `
      <div style="padding:80px 20px;text-align:center;color:#4a5568">
        <div style="font-size:40px;margin-bottom:14px">🖼️</div>
        <div style="font-size:15px;font-weight:600;color:#64748b;margin-bottom:6px">No images found</div>
        <div style="font-size:13px;color:#4a5568">Try another search term.</div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="font-size:12px;color:#4a5568;margin-bottom:14px">${images.length} image${images.length !== 1 ? "s" : ""}</div>
    ${viewMode === "grid" ? renderGrid(images) : renderList(images)}`;

  attachCardHandlers(images);
}

const cardActions = () => `
  <button class="media-action-btn" disabled title="Coming in Phase 2">🔗</button>
  <button class="media-action-btn" disabled title="Coming in Phase 2">🔁</button>
  <button class="media-action-btn" disabled title="Coming in Phase 2">✏️</button>
  <button class="media-action-btn media-action-danger" disabled title="Coming in Phase 2">🗑️</button>`;

function renderGrid(images) {
  return `<div class="media-grid">
    ${images.map(img => `
      <div class="media-card" data-id="${img.id}">
        <div class="media-thumb" style="background-image:url('${img.thumbnail}')"></div>
        <div class="media-card-body">
          <div class="media-filename" title="${escapeHtml(img.filename)}">${escapeHtml(img.filename)}</div>
          <div class="media-meta">${img.width} × ${img.height} &nbsp;·&nbsp; ${formatBytes(img.size)}</div>
          <div class="media-meta media-meta-date">${formatMediaDate(img.uploadedAt)}</div>
        </div>
        <div class="media-card-actions">${cardActions()}</div>
      </div>`).join("")}
  </div>`;
}

function renderList(images) {
  return `<div class="table-wrap">
    <table>
      <thead><tr>
        <th></th><th>Filename</th><th>Folder</th><th>Resolution</th><th>Size</th><th>Uploaded</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${images.map(img => `
          <tr class="media-list-row" data-id="${img.id}" style="cursor:pointer">
            <td style="width:56px"><div class="media-list-thumb" style="background-image:url('${img.thumbnail}')"></div></td>
            <td style="color:#e2e8f0;font-weight:500">${escapeHtml(img.filename)}</td>
            <td style="color:#94a3b8;font-size:13px">${escapeHtml(folderDisplayLabel(img.folder))}</td>
            <td style="color:#94a3b8;font-size:13px">${img.width} × ${img.height}</td>
            <td style="color:#94a3b8;font-size:13px">${formatBytes(img.size)}</td>
            <td style="color:#4a5568;font-size:12px">${formatMediaDate(img.uploadedAt)}</td>
            <td><div class="media-card-actions" style="justify-content:flex-start">${cardActions()}</div></td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function attachCardHandlers(images) {
  const byId = Object.fromEntries(images.map(img => [img.id, img]));
  document.querySelectorAll(".media-card, .media-list-row").forEach(node => {
    node.addEventListener("click", e => {
      if (e.target.closest(".media-action-btn")) return;
      const img = byId[node.dataset.id];
      if (img) openModal(img);
    });
  });
}

// ── Preview modal ────────────────────────────────────────────────
function escListener(e) { if (e.key === "Escape") closeModal(); }

function openModal(img) {
  closeModal();
  const modal = document.createElement("div");
  modal.id = "media-modal-overlay";
  modal.className = "media-modal-overlay";
  modal.innerHTML = `
    <div class="media-modal">
      <button class="media-modal-close" id="media-modal-close" title="Close">✕</button>
      <div class="media-modal-img" style="background-image:url('${img.thumbnail}')"></div>
      <div class="media-modal-info">
        <div class="media-modal-filename">${escapeHtml(img.filename)}</div>
        <div class="media-modal-row"><span>Resolution</span><span>${img.width} × ${img.height}</span></div>
        <div class="media-modal-row"><span>Size</span><span>${formatBytes(img.size)}</span></div>
        <div class="media-modal-row"><span>Folder</span><span>${escapeHtml(folderDisplayLabel(img.folder))}</span></div>
        <div class="media-modal-row"><span>Uploaded</span><span>${formatMediaDate(img.uploadedAt)}</span></div>
        <div class="media-modal-url">${escapeHtml(img.cdnUrl)}</div>
        <div class="media-modal-actions">
          <button id="media-modal-copy" class="media-btn media-btn-primary">📋 Copy URL</button>
          <button id="media-modal-close-btn" class="media-btn media-btn-secondary">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.getElementById("media-modal-close").addEventListener("click", closeModal);
  document.getElementById("media-modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("media-modal-copy").addEventListener("click", e => {
    const btn = e.currentTarget;
    const done = () => { btn.textContent = "✅ Copied!"; setTimeout(() => { btn.textContent = "📋 Copy URL"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(img.cdnUrl).then(done).catch(done);
    else done();
  });

  document.addEventListener("keydown", escListener);
}

function closeModal() {
  document.getElementById("media-modal-overlay")?.remove();
  document.removeEventListener("keydown", escListener);
}