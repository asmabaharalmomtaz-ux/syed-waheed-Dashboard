import { fmtDate } from "./utils.js";

// ── Global Search ─────────────────────────────────────────────
// Searches across all collections instantly as you type

let searchDebounceTimer = null;

export function renderGlobalSearch(data) {
  // Debounce slightly so fast typing doesn't re-render on every keystroke
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => doSearch(data), 80);
}

function doSearch({ buyInterests, sellInterests, properties, members, registrations }) {
  const query     = (document.getElementById("global-search-input")?.value || "").trim().toLowerCase();
  const resultsEl = document.getElementById("global-search-results");
  const countEl   = document.getElementById("global-search-count");
  if (!resultsEl) return;

  // ── Empty state ──────────────────────────────────────────────
  if (!query) {
    resultsEl.innerHTML = `
      <div style="text-align:center;padding:100px 20px;color:#4a5568">
        <div style="font-size:48px;margin-bottom:16px">🔍</div>
        <div style="font-size:16px;font-weight:600;color:#64748b;margin-bottom:8px">Search across all forms</div>
        <div style="font-size:13px;color:#4a5568">Type a building name, area, city, name, or phone number</div>
      </div>`;
    if (countEl) countEl.textContent = "";
    return;
  }

  // ── Tokenized matching — every word in query must appear somewhere ──
  const tokens = query.split(/\s+/).filter(Boolean);

  function matchesQuery(doc) {
    const haystack = flattenToString(doc);
    return tokens.every(t => haystack.includes(t));
  }

  // ── Tag each result with its source + accent color ────────────
  const allResults = [
    ...(buyInterests  || []).filter(matchesQuery).map(d => ({ ...d, _collection: "Buy-Form",      _color: "#34d399", _icon: "🛒" })),
    ...(sellInterests || []).filter(matchesQuery).map(d => ({ ...d, _collection: "Sell-Form",     _color: "#f59e0b", _icon: "💰" })),
    ...(properties    || []).filter(matchesQuery).map(d => ({ ...d, _collection: "Property Form", _color: "#4f8ef7", _icon: "🏘" })),
    ...(members        || []).filter(matchesQuery).map(d => ({ ...d, _collection: "Member",        _color: "#a78bfa", _icon: "🪪" })),
    ...(registrations  || []).filter(matchesQuery).map(d => ({ ...d, _collection: "Registration",  _color: "#94a3b8", _icon: "📋" })),
  ];

  // Sort newest first
  allResults.sort((a, b) => {
    const aT = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bT = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bT - aT;
  });

  if (countEl) {
    countEl.textContent = allResults.length > 0
      ? `${allResults.length} result${allResults.length !== 1 ? "s" : ""} found`
      : "";
  }

  if (allResults.length === 0) {
    resultsEl.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#4a5568">
        <div style="font-size:36px;margin-bottom:12px">😶</div>
        <div style="font-size:15px;font-weight:500;color:#64748b">No results for "<strong style="color:#94a3b8">${escapeHtml(query)}</strong>"</div>
        <div style="font-size:13px;margin-top:8px;color:#4a5568">Try a different building name, area, or keyword</div>
      </div>`;
    return;
  }

  // ── Grid layout — uses full width, auto-fills columns ─────────
  resultsEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px;width:100%">
      ${allResults.map(doc => renderCard(doc, tokens)).join("")}
    </div>`;
}

// ── Flatten any nested object into a single lowercase string ───
function flattenToString(obj, depth = 0) {
  if (depth > 4 || obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    return String(obj).toLowerCase() + " ";
  }
  if (Array.isArray(obj)) {
    return obj.map(v => flattenToString(v, depth + 1)).join(" ");
  }
  if (typeof obj === "object") {
    // Skip Firestore Timestamp internals and id field noise
    if (obj.toDate || obj._collection !== undefined) {
      return Object.entries(obj)
        .filter(([k]) => k !== "_color" && k !== "_icon")
        .map(([, v]) => flattenToString(v, depth + 1)).join(" ");
    }
    return Object.values(obj).map(v => flattenToString(v, depth + 1)).join(" ");
  }
  return "";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function highlight(text, tokens) {
  if (!text || text === "—") return `<span style="color:#4a5568">—</span>`;
  let safe = escapeHtml(String(text));
  tokens.forEach(t => {
    if (!t) return;
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex   = new RegExp(`(${escaped})`, "gi");
    safe = safe.replace(regex, `<mark style="background:rgba(201,168,76,0.35);color:#f0e6c8;border-radius:2px;padding:0 2px">$1</mark>`);
  });
  return safe;
}

function fieldRow(label, value) {
  if (!value || value === "—") return "";
  return `
    <div style="margin-bottom:6px">
      <div style="font-size:10px;color:#4a5568;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:1px">${label}</div>
      <div style="font-size:13px;color:#cbd5e1;word-break:break-word">${value}</div>
    </div>`;
}

// ── Card renderer — pulls relevant fields per collection type ──
function renderCard(doc, tokens) {
  // building-data style (PropertyForm) vs flat style (Buy/Sell-Form, Members, Registrations)
  const buildingData = doc["building-data"] || {};
  const clientData   = doc["client-data"]   || {};

  const area     = buildingData.area     || doc.area     || doc.location           || "—";
  const building = buildingData.building || doc.building                          || "—";
  const city     = buildingData.city     || doc.city                              || "—";
  const name     = clientData.firstPersonName  || doc.name || doc.memberName      || "—";
  const email    = clientData.firstPersonEmail || doc.email                       || "—";
  const phone    = clientData.firstPersonCalling || doc.phone || doc.phoneNumber || doc.whatsapp || "—";
  const date     = fmtDate ? fmtDate(doc.createdAt) : "—";
  const isMember = doc.submittedAsMember;

  // Collection-specific extra field
  let extra = "";
  if (doc._collection === "Buy-Form" || doc._collection === "Sell-Form") {
    extra = fieldRow("Status", highlight(doc.propertyStatus || doc.chosenOption, tokens));
  } else if (doc._collection === "Member") {
    extra = fieldRow("Job Title", highlight(doc.jobTitle, tokens));
  } else if (doc._collection === "Registration") {
    extra = fieldRow("Job Title", highlight(doc.jobTitle, tokens));
  }

  return `
    <div style="
      background:#141720;
      border:1px solid rgba(255,255,255,0.06);
      border-left:3px solid ${doc._color};
      border-radius:12px;
      padding:16px 18px;
      transition:border-color 0.15s, transform 0.15s;
      min-width:0;
    " onmouseover="this.style.borderColor='${doc._color}66'" onmouseout="this.style.borderColor='rgba(255,255,255,0.06)'">

      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="font-size:14px">${doc._icon}</span>
          <span style="
            padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;
            background:${doc._color}22;color:${doc._color};letter-spacing:0.03em;white-space:nowrap;
          ">${doc._collection}</span>
          ${isMember ? `<span style="font-size:9px;background:rgba(52,211,153,0.15);color:#34d399;padding:2px 6px;border-radius:4px;font-weight:700;white-space:nowrap">MEMBER</span>` : ""}
        </div>
        <span style="font-size:11px;color:#4a5568;white-space:nowrap">${date}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">
        ${fieldRow("👤 Name",  highlight(name, tokens))}
        ${fieldRow("📞 Phone", highlight(phone, tokens))}
        ${fieldRow("📍 Area",  highlight(area, tokens))}
        ${fieldRow("🏢 Building", highlight(building, tokens))}
        ${fieldRow("🌆 City",  highlight(city, tokens))}
        ${fieldRow("✉️ Email", highlight(email, tokens))}
      </div>
      ${extra ? `<div style="margin-top:6px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04)">${extra}</div>` : ""}
    </div>`;
}