// -------------------------
// Shared Helpers
// -------------------------
function parseDateDDMMYYYY(s) {
  const [dd, mm, yyyy] = s.trim().split(".");
  return new Date(+yyyy, (+mm) - 1, +dd);
}
function extractStartTime(s) {
  const m = s.match(/\b\d{2}:\d{2}\b/);
  return m ? m[0] : "00:00";
}
function fmtDateHeading(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wk}, ${dd}.${mm}.${yyyy}`;
}

// -------------------------
// Timetable Page
// -------------------------
let ORIGINAL_ROWS = null;
function captureOriginalRows() {
  const tbody = document.querySelector("#timetable tbody");
  if (tbody) {
    ORIGINAL_ROWS = Array.from(tbody.querySelectorAll("tr")).map(tr => tr.cloneNode(true));
  }
}
document.addEventListener("DOMContentLoaded", captureOriginalRows);

function filterTable() {
  const miniLoader = document.getElementById("miniLoader");
  if (miniLoader) miniLoader.style.display = "block";

  setTimeout(() => {
    const courseDropdown = document.getElementById("course");
    const filterCourse = courseDropdown ? courseDropdown.value : "all";

    const datePicker = document.getElementById("datePicker");
    const filterDate = datePicker && datePicker.value ? new Date(datePicker.value) : null;

    const tbody = document.querySelector("#timetable tbody");
    if (!tbody || !ORIGINAL_ROWS) return;

    const rows = ORIGINAL_ROWS.map(r => r.cloneNode(true));

    const recs = rows.map(tr => {
      const tds = tr.querySelectorAll("td");
      const dateStr = tds[0].innerText;
      const timeStr = tds[1].innerText;
      const course = tds[2].innerText;
      const dateObj = parseDateDDMMYYYY(dateStr);
      const timeStart = extractStartTime(timeStr);
      return { tr, course, dateObj, timeStart };
    });

    const filtered = recs.filter(r => {
      const matchCourse = filterCourse === "all" || r.course === filterCourse;
      const matchDate = !filterDate || (
        r.dateObj.getFullYear() === filterDate.getFullYear() &&
        r.dateObj.getMonth() === filterDate.getMonth() &&
        r.dateObj.getDate() === filterDate.getDate()
      );
      return matchCourse && matchDate;
    });

    filtered.sort((a, b) => a.dateObj - b.dateObj || a.timeStart.localeCompare(b.timeStart));

    tbody.innerHTML = "";
    let lastKey = "";
    filtered.forEach(r => {
      const key = r.dateObj.toDateString();
      if (!filterDate && filterCourse === "all" && key !== lastKey) {
        const hdr = document.createElement("tr");
        hdr.className = "date-header";
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = fmtDateHeading(r.dateObj);
        hdr.appendChild(td);
        tbody.appendChild(hdr);
        lastKey = key;
      }
      tbody.appendChild(r.tr);
    });

    if (miniLoader) miniLoader.style.display = "none";
  }, 200);
}

// Reset date filter
function resetDateFilter() {
  const datePicker = document.getElementById("datePicker");
  if (datePicker) datePicker.value = "";
  filterTable();
}

// -------------------------
// Loader Control (300ms)
// -------------------------
document.addEventListener("DOMContentLoaded", function () {
  const timetable = document.getElementById("timetable");
  if (timetable) {
    setTimeout(() => {
      document.getElementById("loader").style.display = "none";
      const content = document.getElementById("content");
      content.style.display = "block";
      setTimeout(() => content.style.opacity = 1, 50);
      filterTable(); // initial ALL view
    }, 300); // fast load
  }
});
// -------------------------
// Conflict Checker
// -------------------------

function timesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

function parseTimeRanges(str, dateObj) {
  return str.split(",").map(part => {
    const range = part.trim().split("–");
    if (range.length === 2) {
      const [h1, m1] = range[0].split(":").map(Number);
      const [h2, m2] = range[1].split(":").map(Number);
      const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), h1, m1);
      const end   = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), h2, m2);
      return { start, end };
    }
    return null;
  }).filter(Boolean);
}

function checkConflicts() {
  const conflictCheck = document.getElementById("conflictCheck").checked;
  const tbody = document.querySelector("#timetable tbody");
  tbody.innerHTML = "";

  if (!conflictCheck) {
    filterTable(); // normal mode
    return;
  }

  // get all rows
  const recs = ORIGINAL_ROWS.map(r => {
    const tds = r.querySelectorAll("td");
    const dateStr = tds[0].innerText;
    const timeStr = tds[1].innerText;
    const course  = tds[2].innerText;
    const loc     = tds[3].innerText;
    const dateObj = parseDateDDMMYYYY(dateStr);
    const ranges  = parseTimeRanges(timeStr, dateObj); // <-- ✅ multiple ranges
    return { tr: r.cloneNode(true), course, dateObj, ranges };
  });

  let conflicts = [];

  // check each pair for overlap
  for (let i = 0; i < recs.length; i++) {
    for (let j = i + 1; j < recs.length; j++) {
      if (recs[i].dateObj.getTime() === recs[j].dateObj.getTime()) {
        for (const r1 of recs[i].ranges) {
          for (const r2 of recs[j].ranges) {
            if (timesOverlap(r1.start, r1.end, r2.start, r2.end)) {
              conflicts.push(recs[i], recs[j]);
            }
          }
        }
      }
    }
  }

  if (conflicts.length === 0) {
    const msg = document.createElement("tr");
    msg.innerHTML = `<td colspan="4" style="text-align:center; color:green; font-weight:bold;">✅ No course conflicts found!</td>`;
    tbody.appendChild(msg);
  } else {
    // remove duplicates
    const unique = [];
    const seen = new Set();
    for (const c of conflicts) {
      const key = c.course + c.dateObj.getTime();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    unique.forEach(r => tbody.appendChild(r.tr));
  }
}

