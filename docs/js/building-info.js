import { fmtDate, escapeHtml } from "./utils.js";

let expandedRows = new Set();

export function renderBuildingInfoTable(docs) {
  const search = (document.getElementById("binfo-search")?.value || "").toLowerCase();
  const filtered = docs.filter(d =>
    !search || [d.building, d.area, d.city, d.personName, d.contactNumber, d.email, d.developer]
      .some(v => (v || "").toLowerCase().includes(search))
  );

  const container = document.getElementById("binfo-container");
  const countEl   = document.getElementById("binfo-count");
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#4a5568">${search ? "No results found." : "No building info submissions yet."}</div>`;
    if (countEl) countEl.textContent = "";
    return;
  }

  container.innerHTML = `<table>
    <thead><tr>
      <th></th>
      <th>Building</th>
      <th>Area / City</th>
      <th>Developer</th>
      <th>Contact</th>
      <th>Phone</th>
      <th>NOC</th>
      <th>Contract</th>
      <th>Date</th>
      <th>Copy</th>
    </tr></thead>
    <tbody id="binfo-tbody"></tbody>
  </table>`;

  const tbody = document.getElementById("binfo-tbody");

  filtered.forEach(d => {
    const isExp = expandedRows.has(d.id);
    const date  = fmtDate(d.createdAt);

    // ── Summary row ──────────────────────────────────────────
    const tr = document.createElement("tr");
    tr.style.cssText = "cursor:pointer;transition:background 0.15s";
    tr.onmouseover = () => tr.style.background = "rgba(255,255,255,0.03)";
    tr.onmouseout  = () => tr.style.background = "";
    tr.innerHTML = `
      <td style="width:32px;text-align:center">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;
          border-radius:50%;background:rgba(79,142,247,0.15);color:#4f8ef7;font-size:11px;font-weight:700;
          transition:transform 0.2s;transform:${isExp ? "rotate(90deg)" : "rotate(0deg)"}">▶</span>
      </td>
      <td style="font-weight:500;color:#e2e8f0">${escapeHtml(d.building) || "—"}</td>
      <td style="color:#94a3b8;font-size:13px">${escapeHtml(d.area) || "—"} · ${escapeHtml(d.city) || "—"}</td>
      <td style="color:#94a3b8;font-size:13px">${escapeHtml(d.developer) || "—"}</td>
      <td style="color:#94a3b8;font-size:13px">${escapeHtml(d.personName) || "—"}</td>
      <td style="color:#94a3b8;font-size:13px">${escapeHtml(d.contactNumber) || "—"}</td>
      <td style="text-align:center">
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;
          background:${d.nocMarketing === "Yes" ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.10)"};
          color:${d.nocMarketing === "Yes" ? "#34d399" : "#f87171"}">
          ${escapeHtml(d.nocMarketing) || "—"}
        </span>
      </td>
      <td style="text-align:center">
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;
          background:${d.contractSigned === "Yes" ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.10)"};
          color:${d.contractSigned === "Yes" ? "#34d399" : "#f87171"}">
          ${escapeHtml(d.contractSigned) || "—"}
        </span>
      </td>
      <td style="color:#4a5568;font-size:12px">${date}</td>
      <td style="text-align:center">
        <button
          class="copy-btn"
          data-id="${escapeHtml(d.id)}"
          title="Copy all details to clipboard"
          style="background:rgba(79,142,247,0.12);border:1px solid rgba(79,142,247,0.25);color:#4f8ef7;
            border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;
            transition:all 0.15s;white-space:nowrap"
          onmouseover="this.style.background='rgba(79,142,247,0.25)'"
          onmouseout="this.style.background='rgba(79,142,247,0.12)'"
        >📋 Copy</button>
      </td>`;

    tr.addEventListener("click", e => {
      // Don't toggle expand when clicking the copy button
      if (e.target.closest(".copy-btn")) return;
      expandedRows.has(d.id) ? expandedRows.delete(d.id) : expandedRows.add(d.id);
      renderBuildingInfoTable(docs);
    });
    tbody.appendChild(tr);

    // ── Expanded detail row ───────────────────────────────────
    const det = document.createElement("tr");
    det.style.display = isExp ? "table-row" : "none";

    // Build the offices section — handle both single entry (legacy flat fields)
    // and the new offices[] array from the repeating form
    const offices = Array.isArray(d.offices) && d.offices.length
      ? d.offices
      : [{
          personName:    d.personName,
          jobTitle:      d.jobTitle,
          floor:         d.floor,
          officeNumber:  d.officeNumber,
          locationUrl:   d.locationUrl,
          contactNumber: d.contactNumber,
          email:         d.email,
          visitDateTime: d.visitDateTime,
          nocMarketing:  d.nocMarketing,
          contractSigned: d.contractSigned,
          activity:      d.activityOfficeInBuilding,
        }];

    const officeBlocks = offices.map((o, i) => `
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);
        border-radius:10px;padding:14px 16px;margin-bottom:${i < offices.length - 1 ? "10px" : "0"}">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;
          color:#4f8ef7;margin-bottom:10px;font-weight:700">
          ${offices.length > 1 ? `🏢 Office ${i + 1}` : "🏢 Office Info"}
        </div>
        ${dr("Person",        o.personName)}
        ${dr("Job Title",     o.jobTitle)}
        ${dr("Floor",         o.floor)}
        ${dr("Office No",     o.officeNumber)}
        ${dr("Contact",       o.contactNumber)}
        ${dr("Email",         o.email)}
        ${dr("Visit",         o.visitDateTime)}
        ${dr("NOC",           o.nocMarketing)}
        ${dr("Contract",      o.contractSigned)}
        ${dr("Activity",      o.activity)}
        ${o.locationUrl ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">
            <a href="${escapeHtml(o.locationUrl)}" target="_blank" rel="noopener"
              style="font-size:12px;color:#4f8ef7;text-decoration:none">
              📍 Location URL →
            </a>
          </div>` : ""}
      </div>`).join("");

    det.innerHTML = `<td colspan="10" style="padding:0">
      <div style="background:rgba(15,17,23,0.6);border-left:3px solid #4f8ef7;padding:20px 28px">

        <!-- Top: building info grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;margin-bottom:20px">

          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;
              color:#4a5568;margin-bottom:10px;font-weight:600">📍 Location</div>
            ${dr("Country",     d.country)}
            ${dr("City",        d.city)}
            ${dr("Area",        d.area)}
            ${dr("District",    d.district)}
            ${dr("Street",      d.street)}
            ${dr("Block",       d.block)}
          </div>

          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;
              color:#4a5568;margin-bottom:10px;font-weight:600">🏗 Building</div>
            ${dr("Building",         d.building)}
            ${dr("Main Name",        d.mainBuildingName)}
            ${dr("Developer",        d.developer)}
            ${dr("Management Co.",   d.managementCompany)}
            ${dr("Total Offices",    d.totalOffices)}
            ${dr("Purpose",          Array.isArray(d.propertyPurpose) ? d.propertyPurpose.join(", ") : d.propertyPurpose)}
          </div>

          ${d.memberName ? `<div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;
              color:#4a5568;margin-bottom:10px;font-weight:600">🪪 Submitted By</div>
            ${dr("Member",  d.memberName)}
            ${dr("Phone",   d.memberPhone)}
          </div>` : ""}

        </div>

        <!-- Divider -->
        <div style="border-top:1px solid rgba(255,255,255,0.06);margin-bottom:16px"></div>

        <!-- Office entries -->
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;
          color:#4a5568;margin-bottom:10px;font-weight:600">
          Contact & Visit (${offices.length} office${offices.length !== 1 ? "s" : ""})
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
          ${officeBlocks}
        </div>

      </div>
    </td>`;

    tbody.appendChild(det);

    // ── Copy button handler ───────────────────────────────────
    const copyBtn = tr.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", e => {
        e.stopPropagation();
        const text = buildCopyText(d, offices);
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "✅ Copied!";
          copyBtn.style.color = "#34d399";
          copyBtn.style.borderColor = "rgba(52,211,153,0.3)";
          copyBtn.style.background  = "rgba(52,211,153,0.1)";
          setTimeout(() => {
            copyBtn.textContent = "📋 Copy";
            copyBtn.style.color = "#4f8ef7";
            copyBtn.style.borderColor = "rgba(79,142,247,0.25)";
            copyBtn.style.background  = "rgba(79,142,247,0.12)";
          }, 2000);
        }).catch(() => {
          // Fallback for browsers that block clipboard
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity  = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          copyBtn.textContent = "✅ Copied!";
          setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 2000);
        });
      });
    }
  });

  if (countEl) countEl.textContent = `${filtered.length} submission${filtered.length !== 1 ? "s" : ""}`;
}

// ── Copy text builder ─────────────────────────────────────────────────────────
// Produces a clean, WhatsApp-friendly plain-text block.
function buildCopyText(d, offices) {
  const line = (label, value) => value ? `${label}: ${value}\n` : "";
  const divider = "─────────────────────────\n";

  let text = `🏢 BUILDING INFO\n${divider}`;
  text += line("Building",       d.building);
  text += line("Main Name",      d.mainBuildingName);
  text += line("Developer",      d.developer);
  text += line("Country",        d.country);
  text += line("City",           d.city);
  text += line("Area",           d.area);
  text += line("District",       d.district);
  text += line("Street",         d.street);
  text += line("Block",          d.block);
  text += line("Management Co.", d.managementCompany);
  text += line("Total Offices",  d.totalOffices);
  text += line("Purpose",        Array.isArray(d.propertyPurpose) ? d.propertyPurpose.join(", ") : d.propertyPurpose);
  text += "\n";

  offices.forEach((o, i) => {
    text += offices.length > 1
      ? `📋 OFFICE ${i + 1}\n${divider}`
      : `📋 CONTACT & VISIT\n${divider}`;
    text += line("Person",       o.personName);
    text += line("Job Title",    o.jobTitle);
    text += line("Floor",        o.floor);
    text += line("Office No",    o.officeNumber);
    text += line("Contact",      o.contactNumber);
    text += line("Email",        o.email);
    text += line("Visit",        o.visitDateTime);
    text += line("NOC",          o.nocMarketing);
    text += line("Contract",     o.contractSigned);
    text += line("Activity",     o.activity);
    if (o.locationUrl) text += line("Location URL", o.locationUrl);
    text += "\n";
  });

  return text.trim();
}

// ── Row detail helper ─────────────────────────────────────────────────────────
function dr(label, value) {
  if (!value && value !== 0) return "";
  return `<div style="display:flex;justify-content:space-between;padding:4px 0;
    border-bottom:1px solid rgba(255,255,255,0.04);gap:12px">
    <span style="font-size:12px;color:#4a5568;flex-shrink:0">${escapeHtml(label)}</span>
    <span style="font-size:12px;color:#cbd5e1;text-align:right">${escapeHtml(String(value))}</span>
  </div>`;
}