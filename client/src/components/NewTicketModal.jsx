import { useState } from 'react';
import { PRIORITIES } from '../constants';

export default function NewTicketModal({
  defaultStatusId,
  defaultWorkspaceId,
  statuses,
  workspaces,
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(defaultStatusId);
  const [priority, setPriority] = useState('none');
  const [deadline, setDeadline] = useState('');
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description,
      status_id: Number(statusId),
      priority,
      deadline,
      labels: [],
      workspace_id: workspaceId ? Number(workspaceId) : null,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal new-ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>New ticket</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ticket title" />

          <label className="field-label">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
          />

          <div className="new-ticket-row">
            <div>
              <label className="field-label">Status</label>
              <select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="field-label">Workspace</label>
          <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}>
            <option value="">No workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <label className="field-label">Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

          <div className="new-ticket-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Create ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
