// Emergent object storage client (Node.js)
const STORAGE_BASE =
  (process.env.INTEGRATION_PROXY_URL || '').trim() || 'https://integrations.emergentagent.com';
const STORAGE_URL = STORAGE_BASE.replace(/\/$/, '') + '/objstore/api/v1/storage';
const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY;

let storageKey = null;

async function initStorage(force = false) {
  if (storageKey && !force) return storageKey;
  const resp = await fetch(`${STORAGE_URL}/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergent_key: EMERGENT_KEY }),
  });
  if (!resp.ok) throw new Error(`Storage init failed (${resp.status})`);
  const data = await resp.json();
  storageKey = data.storage_key;
  return storageKey;
}

async function putObject(path, buffer, contentType) {
  let key = await initStorage();
  const doPut = (k) =>
    fetch(`${STORAGE_URL}/objects/${path}`, {
      method: 'PUT',
      headers: { 'X-Storage-Key': k, 'Content-Type': contentType },
      body: buffer,
    });
  let resp = await doPut(key);
  if (resp.status === 404) {
    key = await initStorage(true);
    resp = await doPut(key);
  }
  if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
  return resp.json();
}

async function getObject(path) {
  let key = await initStorage();
  const doGet = (k) =>
    fetch(`${STORAGE_URL}/objects/${path}`, { headers: { 'X-Storage-Key': k } });
  let resp = await doGet(key);
  if (resp.status === 404) {
    key = await initStorage(true);
    resp = await doGet(key);
  }
  if (!resp.ok) throw new Error(`Download failed (${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  return { buffer, contentType: resp.headers.get('Content-Type') || 'application/octet-stream' };
}

module.exports = { initStorage, putObject, getObject };
