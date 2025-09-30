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

function getTimetableEvents() {
  const rows = document.querySelectorAll('#timetable tbody tr');
  const events = [];
  rows.forEach(row => {
    // Ignore comment rows or rows with no cells
    const cells = row.querySelectorAll('td');
    if (cells.length === 4 && row.style.display !== 'none') {
      events.push({
        date: cells[0].textContent.trim(),
        time: cells[1].textContent.trim(),
        course: cells[2].textContent.trim(),
        location: cells[3].textContent.trim()
      });
    }
  });
  return events;
}

let calendarMonth, calendarYear;

function updateCalendarHeader(month, year) {
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  document.getElementById('calendarMonthYear').textContent =
    `${monthNames[month]} ${year}`;
}

function renderCalendar(month, year) {
  calendarMonth = month;
  calendarYear = year;
  updateCalendarHeader(month, year);

  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();

  // Weekday headers
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  weekdays.forEach(day => {
    const header = document.createElement('div');
    header.textContent = day;
    header.className = 'calendar-day calendar-header';
    calendar.appendChild(header);
  });

  // Blank days before first
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day';
    calendar.appendChild(blank);
  }

  // Days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const cellDate = new Date(year, month, d);
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear()
    ) {
      cell.classList.add('today');
    }
    cell.innerHTML = `<div style="font-weight:bold;">${d}</div>`;

    // Show events for this day
    const events = getTimetableEvents();
    events.forEach(ev => {
      const [dd, mm, yyyy] = ev.date.split('.');
      const evDate = new Date(`${yyyy}-${mm}-${dd}`);
      if (
        evDate.getDate() === cellDate.getDate() &&
        evDate.getMonth() === cellDate.getMonth() &&
        evDate.getFullYear() === cellDate.getFullYear()
      ) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        eventDiv.textContent = `${ev.time} ${ev.course}`;
        eventDiv.style.cursor = 'pointer';
        eventDiv.onclick = () => showEventDetail(ev);
        cell.appendChild(eventDiv);
      }
    });

    calendar.appendChild(cell);
  }

  // Fill remaining cells to complete the last week
  const totalCells = weekdays.length + startDay + lastDay.getDate();
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day';
      calendar.appendChild(blank);
    }
  }
}

// Navigation event listeners
document.addEventListener('DOMContentLoaded', function() {
  const now = new Date();
  renderCalendar(now.getMonth(), now.getFullYear());

  document.getElementById('prevMonthBtn').onclick = function() {
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) { m = 11; y--; }
    renderCalendar(m, y);
  };
  document.getElementById('nextMonthBtn').onclick = function() {
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) { m = 0; y++; }
    renderCalendar(m, y);
  };
});

// Show current month calendar on page load
document.addEventListener('DOMContentLoaded', function() {
  const now = new Date();
  renderCalendar(now.getMonth(), now.getFullYear());
});

function showContent() {
  document.getElementById('loader').style.display = 'none';
  const content = document.getElementById('content');
  content.style.display = 'block';
  setTimeout(() => content.style.opacity = 1, 100);

  // Render calendar after timetable is visible
  const now = new Date();
  renderCalendar(now.getMonth(), now.getFullYear());
}

function openCalendarModal() {
  document.getElementById('calendarModal').style.display = 'block';
  // Render calendar when modal opens
  const now = new Date();
  renderCalendar(calendarMonth ?? now.getMonth(), calendarYear ?? now.getFullYear());
}
function closeCalendarModal() {
  document.getElementById('calendarModal').style.display = 'none';
}

// Optional: Close modal when clicking outside content
window.onclick = function(event) {
  const modal = document.getElementById('calendarModal');
  if (event.target === modal) {
    closeCalendarModal();
  }

  const eventModal = document.getElementById('eventDetailModal');
  if (event.target === eventModal) {
    closeEventDetailModal();
  }
};

function showEventDetail(eventObj) {
  const body = document.getElementById('eventDetailBody');
  body.innerHTML = `
    <strong>Course:</strong> ${eventObj.course}<br>
    <strong>Date:</strong> ${eventObj.date}<br>
    <strong>Time:</strong> ${eventObj.time}<br>
    <strong>Location:</strong> ${eventObj.location}
  `;
  document.getElementById('eventDetailModal').style.display = 'block';
}

function closeEventDetailModal() {
  document.getElementById('eventDetailModal').style.display = 'none';
}

