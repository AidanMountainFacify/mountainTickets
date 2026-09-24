import { trackSave } from './pendingSaves';

const BASE = '/api/tickets';
const WORKSPACES_BASE = '/api/workspaces';
const STATUSES_BASE = '/api/statuses';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listTickets: () => fetch(BASE).then(handle),
  createTicket: (data) =>
    trackSave(
      fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  updateTicket: (id, data) =>
    trackSave(
      fetch(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  deleteTicket: (id) => trackSave(fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handle)),
  listComments: (id) => fetch(`${BASE}/${id}/comments`).then(handle),
  addComment: (id, data) =>
    trackSave(
      fetch(`${BASE}/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),

  listChecklist: (ticketId) => fetch(`${BASE}/${ticketId}/checklist`).then(handle),
  addChecklistItem: (ticketId, data) =>
    trackSave(
      fetch(`${BASE}/${ticketId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  updateChecklistItem: (ticketId, itemId, data) =>
    trackSave(
      fetch(`${BASE}/${ticketId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  deleteChecklistItem: (ticketId, itemId) =>
    trackSave(fetch(`${BASE}/${ticketId}/checklist/${itemId}`, { method: 'DELETE' }).then(handle)),

  listWorkspaces: () => fetch(WORKSPACES_BASE).then(handle),
  createWorkspace: (data) =>
    trackSave(
      fetch(WORKSPACES_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  updateWorkspace: (id, data) =>
    trackSave(
      fetch(`${WORKSPACES_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  deleteWorkspace: (id) => trackSave(fetch(`${WORKSPACES_BASE}/${id}`, { method: 'DELETE' }).then(handle)),

  listStatuses: () => fetch(STATUSES_BASE).then(handle),
  createStatus: (data) =>
    trackSave(
      fetch(STATUSES_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  updateStatus: (id, data) =>
    trackSave(
      fetch(`${STATUSES_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handle)
    ),
  deleteStatus: (id, data) =>
    trackSave(
      fetch(`${STATUSES_BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      }).then(handle)
    ),
};
