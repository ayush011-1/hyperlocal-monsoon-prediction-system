const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchLocations() {
  const res = await fetch(`${API_BASE}/locations`);
  if (!res.ok) throw new Error('Failed to load locations');
  return res.json();
}

export async function fetchForecast(district, block, panchayat, days = 14) {
  const query = new URLSearchParams({
    district: district || 'Pune',
    block: block || 'Haveli',
    panchayat: panchayat || 'Wagholi',
    days: days.toString()
  });
  const res = await fetch(`${API_BASE}/forecast?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
}

export async function fetchClimateIndicators() {
  const res = await fetch(`${API_BASE}/climate-indicators`);
  if (!res.ok) throw new Error('Failed to load climate indicators');
  return res.json();
}

export async function fetchAdvisory(crop, district, block, panchayat, days = 14) {
  const query = new URLSearchParams({
    crop: crop || 'soybean',
    district: district || 'Pune',
    block: block || 'Haveli',
    panchayat: panchayat || 'Wagholi',
    days: days.toString()
  });
  const res = await fetch(`${API_BASE}/advisory?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch crop advisory');
  return res.json();
}

export async function fetchSupportedCrops() {
  const res = await fetch(`${API_BASE}/advisory/supported-crops`);
  if (!res.ok) throw new Error('Failed to load supported crops');
  return res.json();
}

export async function fetchFieldObservations() {
  const res = await fetch(`${API_BASE}/field-observations`);
  if (!res.ok) throw new Error('Failed to load field observations');
  return res.json();
}

export async function submitFieldObservation(payload) {
  const res = await fetch(`${API_BASE}/field-observation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit field observation');
  return res.json();
}

export async function fetchPipelineInfo() {
  const res = await fetch(`${API_BASE}/pipeline-info`);
  if (!res.ok) throw new Error('Failed to load pipeline info');
  return res.json();
}

export async function fetchNlpQuery(query, district = 'Pune', block = 'Haveli', panchayat = 'Wagholi', crop = 'soybean', days = 14, language = null) {
  const res = await fetch(`${API_BASE}/nlp/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, district, block, panchayat, crop, days, language })
  });
  if (!res.ok) throw new Error('Failed to execute NLP query');
  return res.json();
}

export async function fetchAgentChat(message, conversation_history = [], district = 'Pune', block = 'Haveli', panchayat = 'Wagholi', crop = 'soybean', days = 14, language = 'en') {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, conversation_history, district, block, panchayat, crop, days, language })
  });
  if (!res.ok) throw new Error('Failed to send message to Farmer Support Agent');
  return res.json();
}

export async function sendNotification(payload) {
  const res = await fetch(`${API_BASE}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to send notification alert');
  return res.json();
}



