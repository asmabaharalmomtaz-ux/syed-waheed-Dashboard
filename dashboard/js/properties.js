import { fmtPKR } from "./utils.js";

export function renderPropertiesTable(properties) {
  const tbody = document.getElementById("props-tbody");
  if (!tbody) return;
  if (!properties.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No properties in Firebase yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = properties.map((p, i) => `
    <tr style="background:${i%2===0?"transparent":"rgba(255,255,255,0.01)"}">
      <td style="color:#e2e8f0;font-weight:500">${p.title||p.name||"Untitled"}</td>
      <td>${p.category||p.type||"—"}</td>
      <td>${p.location||p.city||"—"}</td>
      <td>${p.price ? fmtPKR(p.price) : "—"}</td>
      <td>${p.bedrooms||"—"}</td>
      <td><span class="badge" style="background:rgba(52,211,153,0.12);color:#34d399">${p.status||"Active"}</span></td>
    </tr>`).join("");
}
