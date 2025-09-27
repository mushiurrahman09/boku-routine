// -------------------------
// Shared Helpers
// -------------------------
function parseDateDDMMYYYY(s) {
  const [dd, mm, yyyy] = s.trim().split(".");
  return new Date(+yyyy, (+mm) - 1, +dd);
}
function fmtDateHeading(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wk}, ${dd}.${mm}.${yyyy}`;
}

// -------------------------
// Exam Routine Page
// -------------------------
let ORIGINAL_EXAM_ROWS = null;
function captureOriginalExamRows() {
  const tbody = document.querySelector("#examTable tbody");
  if (tbody) {
    ORIGINAL_EXAM_ROWS = Array.from(tbody.querySelectorAll("tr")).map(tr => tr.cloneNode(true));
  }
}
document.addEventListener("DOMContentLoaded", captureOriginalExamRows);

function filterExamTable() {
  const miniLoader = document.getElementById("miniLoader");
  if (miniLoader) miniLoader.style.display = "block";

  setTimeout(() => {
    const courseDropdown = document.getElementById("examCourse");
    const filterCourse = courseDropdown ? courseDropdown.value : "all";

    const datePicker = document.getElementById("examDate");
    const filterDate = datePicker && datePicker.value ? new Date(datePicker.value) : null;

    const tbody = document.querySelector("#examTable tbody");
    if (!tbody || !ORIGINAL_EXAM_ROWS) return;

    const rows = ORIGINAL_EXAM_ROWS.map(r => r.cloneNode(true));

    const recs = rows.map(tr => {
      const tds = tr.querySelectorAll("td");
      const dateStr = tds[0].innerText;
      const course = tds[2].innerText;
      const dateObj = parseDateDDMMYYYY(dateStr);
      return { tr, course, dateObj };
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

    filtered.sort((a, b) => a.dateObj - b.dateObj);

    tbody.innerHTML = "";
    filtered.forEach(r => tbody.appendChild(r.tr));

    if (miniLoader) miniLoader.style.display = "none";
  }, 200);
}

function resetExamDateFilter() {
  const datePicker = document.getElementById("examDate");
  if (datePicker) datePicker.value = "";
  filterExamTable();
}

// -------------------------
// Loader Control (300ms)
// -------------------------
document.addEventListener("DOMContentLoaded", function () {
  const examTable = document.getElementById("examTable");
  if (examTable) {
    setTimeout(() => {
      document.getElementById("loader").style.display = "none";
      const content = document.getElementById("content");
      content.style.display = "block";
      setTimeout(() => content.style.opacity = 1, 50);
      filterExamTable(); // initial ALL view
    }, 300); // fast load
  }
});
