// --- Minimal front-end gate (casual protection) ---

// SHA-256 of the allowed code: "EMPLANT2025!"
// Change this by hashing your own code (hex) and replacing value:
const PASSWORD_HASH_HEX = "903deb3c7b3612c4854729f63933b97a1401c3ef168b5571ccf25775a1f4301d";

// Session key
const AUTH_KEY = "authed_v1";

// Hash a string to SHA-256 hex using Web Crypto
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Compare input code to stored hash
async function verifyCode(code) {
  const hex = await sha256Hex(code);
  if (hex === PASSWORD_HASH_HEX) {
    sessionStorage.setItem(AUTH_KEY, "1"); // set session flag (clears when tab closes)
    return true;
  }
  return false;
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function requireAuth() {
  if (!isAuthed()) {
    const next = encodeURIComponent(location.pathname.replace(/^\//, '') + location.search);
    location.replace(`login.html?next=${next}`);
  }
}

// Optional: call to log out (attach to a button if you like)
function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  location.replace("login.html");
}
