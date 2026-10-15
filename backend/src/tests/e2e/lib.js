/**
 * Minimal end-to-end API test helpers (no extra dependencies, Node 18+ fetch).
 * See README "End-to-end API tests" before running: the suite CREATES data.
 */
const BASE = process.env.E2E_API_URL || 'http://localhost:5000/api';
let pass = 0, fail = 0; const failures = [];
async function req(method, path, { token, body, raw, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let b;
  if (raw !== undefined) b = raw; else if (body !== undefined) { h['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
  const r = await fetch(BASE + path, { method, headers: h, body: b });
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, body: json };
}
function check(name, cond, extra) {
  if (cond) { pass++; } else { fail++; failures.push(name); console.log('  FAIL:', name, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}
async function login(loginId, password) {
  const r = await req('POST', '/auth/login', { body: { loginId, password } });
  if (r.status !== 200) throw new Error('login failed ' + loginId + ' ' + JSON.stringify(r.body));
  return r.body.data.accessToken;
}
function summary() { console.log(`\nPASS ${pass}  FAIL ${fail}`); if (failures.length) console.log(failures.map(f => ' - ' + f).join('\n')); return fail; }
module.exports = { req, check, login, summary };
