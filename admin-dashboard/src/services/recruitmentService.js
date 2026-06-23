// ============================================================================
//  Recruitment AI service — talks to the Flask /api/ai/* routes.
//  Same base URL convention as the rest of the dashboard (localhost:5000).
// ============================================================================

const API_BASE = "http://localhost:5000/api/ai";

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore non-JSON */
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Erreur ${res.status}`);
  }
  return data;
}

export async function aiHealth() {
  return handle(await fetch(`${API_BASE}/health`));
}

export async function listJobs(companyId) {
  const q = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
  return handle(await fetch(`${API_BASE}/jobs${q}`));
}

export async function createJob(job) {
  return handle(
    await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    })
  );
}

// Upload a CV file (PDF/DOCX/TXT). Optionally link to a job offer to also match.
export async function analyzeCvFile(file, { companyId, jobOfferId } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (companyId) form.append("company_id", companyId);
  if (jobOfferId) form.append("job_offer_id", jobOfferId);
  return handle(await fetch(`${API_BASE}/cv/analyze`, { method: "POST", body: form }));
}

export async function listCandidates({ companyId, jobOfferId, category } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", companyId);
  if (jobOfferId) params.set("job_offer_id", jobOfferId);
  if (category) params.set("category", category);
  const q = params.toString() ? `?${params}` : "";
  return handle(await fetch(`${API_BASE}/candidates${q}`));
}

export async function candidateDetail(id) {
  return handle(await fetch(`${API_BASE}/candidates/${id}`));
}

export async function rematch(candidateId, jobOfferId) {
  return handle(
    await fetch(`${API_BASE}/cv/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, job_offer_id: jobOfferId }),
    })
  );
}

// ---- Feature 5: interview questions ----
export async function generateInterview(candidateId, jobOfferId) {
  return handle(
    await fetch(`${API_BASE}/interview/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, job_offer_id: jobOfferId || undefined }),
    })
  );
}

// ---- Feature 4: smart reclamation AI ----
export async function classifyReclamation({ subject, message, reclamationId } = {}) {
  return handle(
    await fetch(`${API_BASE}/reclamation/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, reclamation_id: reclamationId }),
    })
  );
}

export async function analyzeAllReclamations() {
  return handle(
    await fetch(`${API_BASE}/reclamation/analyze-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ only_new: true }),
    })
  );
}

// ---- Feature 6: HR insights summary ----
export async function insightsSummary({ companyId, days = 30 } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", companyId);
  params.set("days", days);
  return handle(await fetch(`${API_BASE}/insights/summary?${params}`));
}
