import { useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import TicketModal from './components/TicketModal';
import NewTicketModal from './components/NewTicketModal';
import WorkspaceModal from './components/WorkspaceModal';
import DeleteColumnModal from './components/DeleteColumnModal';
import { api } from './api';
import { waitForPendingSaves } from './pendingSaves';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [newTicketStatusId, setNewTicketStatusId] = useState(null);
  const [managingWorkspaces, setManagingWorkspaces] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState(null);
  const [search, setSearch] = useState('');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('all');
  const [collapsedStatusIds, setCollapsedStatusIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mt-collapsed-columns');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore — localStorage can be unavailable in some environments
    }
    return new Set();
  });
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('mt-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore — localStorage can be unavailable in some environments
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mt-theme', theme);
    } catch {
      // ignore — nothing we can do if storage is unavailable
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('mt-collapsed-columns', JSON.stringify([...collapsedStatusIds]));
    } catch {
      // ignore — nothing we can do if storage is unavailable
    }
  }, [collapsedStatusIds]);

  function toggleColumnCollapse(statusId) {
    setCollapsedStatusIds((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  }

  useEffect(() => {
    if (!window.mtApp) return;
    // A field like the ticket title only saves on blur. Clicking the
    // window's native close button doesn't blur the focused field the way
    // clicking elsewhere in the app does, so without this, a just-typed
    // edit could still be unsaved when the app (and its embedded server)
    // shuts down. Force a blur to trigger that save, then hold the window
    // close until it's actually confirmed written.
    window.mtApp.onBeforeClose(async () => {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      await waitForPendingSaves();
      window.mtApp.confirmReadyToClose();
    });
  }, []);

  useEffect(() => {
    Promise.all([api.listTickets(), api.listWorkspaces(), api.listStatuses()])
      .then(([t, w, s]) => {
        setTickets(t);
        setWorkspaces(w);
        setStatuses(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const workspacesById = useMemo(() => new Map(workspaces.map((w) => [w.id, w])), [workspaces]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (currentWorkspaceId !== 'all') {
      result = result.filter((t) => t.workspace_id === currentWorkspaceId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.labels.some((l) => l.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tickets, search, currentWorkspaceId]);

  async function persistUpdate(id, patch) {
    try {
      const updated = await api.updateTicket(id, patch);
      // The single-ticket response doesn't include the checklist aggregate
      // (only the list endpoint computes it) — merge rather than replace so
      // the card's progress badge doesn't disappear after an unrelated edit.
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      setActiveTicket((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(data) {
    try {
      const created = await api.createTicket(data);
      setTickets((prev) => [...prev, created]);
      setNewTicketStatusId(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      await api.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setActiveTicket(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleChecklistChange(ticketId, total, checked) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, checklist_total: total, checklist_checked: checked } : t))
    );
  }

  async function handleCreateWorkspace(data) {
    try {
      const created = await api.createWorkspace(data);
      setWorkspaces((prev) => [...prev, created]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRenameWorkspace(id, name) {
    try {
      const updated = await api.updateWorkspace(id, { name });
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRecolorWorkspace(id, color) {
    try {
      const updated = await api.updateWorkspace(id, { color });
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteWorkspace(workspace) {
    if (!confirm(`Delete workspace "${workspace.name}"? Its tickets will become unassigned, not deleted.`)) return;
    try {
      await api.deleteWorkspace(workspace.id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspace.id));
      setTickets((prev) => prev.map((t) => (t.workspace_id === workspace.id ? { ...t, workspace_id: null } : t)));
      if (currentWorkspaceId === workspace.id) setCurrentWorkspaceId('all');
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRenameStatus(id, label) {
    try {
      const updated = await api.updateStatus(id, { label });
      setStatuses((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddStatus(label) {
    try {
      const created = await api.createStatus({ label });
      setStatuses((prev) => [...prev, created]);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleDeleteStatus(status) {
    const ticketCount = tickets.filter((t) => t.status_id === status.id).length;
    if (ticketCount === 0) {
      if (!confirm(`Delete the "${status.label}" column?`)) return;
      finishDeleteStatus(status.id, null);
    } else {
      setDeletingStatus(status);
    }
  }

  async function finishDeleteStatus(statusId, reassignTo) {
    try {
      await api.deleteStatus(statusId, reassignTo ? { reassignTo } : undefined);
      setStatuses((prev) => prev.filter((s) => s.id !== statusId));
      setCollapsedStatusIds((prev) => {
        if (!prev.has(statusId)) return prev;
        const next = new Set(prev);
        next.delete(statusId);
        return next;
      });
      if (reassignTo) {
        // Positions for moved tickets are recomputed server-side; refetch
        // rather than guessing them here.
        const fresh = await api.listTickets();
        setTickets(fresh);
      }
      setDeletingStatus(null);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>⛰ Mountain Tickets</h1>
        <input
          className="search-input"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="primary-btn"
          onClick={() => setNewTicketStatusId(statuses[0]?.id ?? null)}
          disabled={statuses.length === 0}
        >
          + New ticket
        </button>
        <button
          className="theme-toggle-btn"
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="workspace-bar">
        <button
          className={`workspace-pill ${currentWorkspaceId === 'all' ? 'workspace-pill-active' : ''}`}
          onClick={() => setCurrentWorkspaceId('all')}
        >
          All
        </button>
        {workspaces.map((w) => (
          <button
            key={w.id}
            className={`workspace-pill ${currentWorkspaceId === w.id ? 'workspace-pill-active' : ''}`}
            style={currentWorkspaceId === w.id ? { backgroundColor: w.color, color: 'white', borderColor: w.color } : {}}
            onClick={() => setCurrentWorkspaceId(w.id)}
          >
            <span className="workspace-pill-dot" style={{ backgroundColor: w.color }} />
            {w.name}
          </button>
        ))}
        <button className="workspace-pill workspace-pill-manage" onClick={() => setManagingWorkspaces(true)}>
          Manage
        </button>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} (click to dismiss)
        </div>
      )}

      {loading ? (
        <div className="loading">Loading board...</div>
      ) : (
        <Board
          tickets={filteredTickets}
          statuses={statuses}
          setTickets={setTickets}
          onOpenTicket={setActiveTicket}
          onAddTicket={setNewTicketStatusId}
          onPersist={persistUpdate}
          workspacesById={workspacesById}
          onRenameStatus={handleRenameStatus}
          onDeleteStatus={handleDeleteStatus}
          onAddStatus={handleAddStatus}
          collapsedStatusIds={collapsedStatusIds}
          onToggleCollapse={toggleColumnCollapse}
        />
      )}

      {activeTicket && (
        <TicketModal
          ticket={activeTicket}
          workspaces={workspaces}
          statuses={statuses}
          onClose={() => setActiveTicket(null)}
          onUpdate={persistUpdate}
          onDelete={handleDelete}
          onChecklistChange={handleChecklistChange}
        />
      )}

      {newTicketStatusId && (
        <NewTicketModal
          defaultStatusId={newTicketStatusId}
          defaultWorkspaceId={currentWorkspaceId === 'all' ? null : currentWorkspaceId}
          statuses={statuses}
          workspaces={workspaces}
          onClose={() => setNewTicketStatusId(null)}
          onCreate={handleCreate}
        />
      )}

      {managingWorkspaces && (
        <WorkspaceModal
          workspaces={workspaces}
          onClose={() => setManagingWorkspaces(false)}
          onCreate={handleCreateWorkspace}
          onRename={handleRenameWorkspace}
          onRecolor={handleRecolorWorkspace}
          onDelete={handleDeleteWorkspace}
        />
      )}

      {deletingStatus && (
        <DeleteColumnModal
          status={deletingStatus}
          ticketCount={tickets.filter((t) => t.status_id === deletingStatus.id).length}
          otherStatuses={statuses.filter((s) => s.id !== deletingStatus.id)}
          onClose={() => setDeletingStatus(null)}
          onConfirm={(reassignTo) => finishDeleteStatus(deletingStatus.id, reassignTo)}
        />
      )}
    </div>
  );
}
