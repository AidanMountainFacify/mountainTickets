import { useEffect, useState } from 'react';
import { PRIORITIES } from '../constants';
import { api } from '../api';
import ChecklistSection from './ChecklistSection';

export default function TicketModal({ ticket, workspaces, statuses, onClose, onUpdate, onDelete, onChecklistChange }) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [labelsInput, setLabelsInput] = useState(ticket.labels.join(', '));
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    setTitle(ticket.title);
    setDescription(ticket.description);
    setLabelsInput(ticket.labels.join(', '));
    setLoadingComments(true);
    api
      .listComments(ticket.id)
      .then(setComments)
      .finally(() => setLoadingComments(false));
    api.listChecklist(ticket.id).then(setChecklist);
  }, [ticket.id]);

  function reportChecklistCounts(items) {
    onChecklistChange(ticket.id, items.length, items.filter((i) => i.checked).length);
  }

  async function handleChecklistAdd(text) {
    const item = await api.addChecklistItem(ticket.id, { text });
    setChecklist((prev) => {
      const next = [...prev, item];
      reportChecklistCounts(next);
      return next;
    });
  }

  async function handleChecklistToggle(itemId, checked) {
    const item = await api.updateChecklistItem(ticket.id, itemId, { checked });
    setChecklist((prev) => {
      const next = prev.map((i) => (i.id === itemId ? item : i));
      reportChecklistCounts(next);
      return next;
    });
  }

  async function handleChecklistEditText(itemId, text) {
    const item = await api.updateChecklistItem(ticket.id, itemId, { text });
    setChecklist((prev) => prev.map((i) => (i.id === itemId ? item : i)));
  }

  async function handleChecklistDelete(itemId) {
    await api.deleteChecklistItem(ticket.id, itemId);
    setChecklist((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      reportChecklistCounts(next);
      return next;
    });
  }

  function saveField(field, value) {
    onUpdate(ticket.id, { [field]: value });
  }

  function handleTitleBlur() {
    if (title.trim() && title !== ticket.title) saveField('title', title.trim());
  }

  function handleDescriptionBlur() {
    if (description !== ticket.description) saveField('description', description);
  }

  function handleLabelsBlur() {
    const labels = labelsInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    onUpdate(ticket.id, { labels });
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = await api.addComment(ticket.id, { body: newComment.trim() });
    setComments((prev) => [...prev, comment]);
    setNewComment('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="ticket-modal-id">MT-{ticket.id}</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <input
          className="ticket-modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
        />

        <div className="ticket-modal-body">
          <div className="ticket-modal-main">
            <label className="field-label">Description</label>
            <textarea
              className="ticket-modal-description"
              value={description}
              placeholder="Add a description..."
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={9}
            />

            <ChecklistSection
              items={checklist}
              onToggle={handleChecklistToggle}
              onAdd={handleChecklistAdd}
              onEditText={handleChecklistEditText}
              onDelete={handleChecklistDelete}
            />

            <label className="field-label">Comments</label>
            <div className="comments-list">
              {loadingComments && <div className="comments-empty">Loading...</div>}
              {!loadingComments && comments.length === 0 && (
                <div className="comments-empty">No comments yet</div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-meta">
                    {c.author || 'You'} · {new Date(c.created_at).toLocaleString()}
                  </div>
                  <div className="comment-body">{c.body}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                placeholder="Leave a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
              <button type="submit">Comment</button>
            </form>
          </div>

          <div className="ticket-modal-sidebar">
            <label className="field-label">Workspace</label>
            <select
              value={ticket.workspace_id ?? ''}
              onChange={(e) => onUpdate(ticket.id, { workspace_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">No workspace</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label className="field-label">Status</label>
            <select
              value={ticket.status_id}
              onChange={(e) => onUpdate(ticket.id, { status_id: Number(e.target.value) })}
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <label className="field-label">Priority</label>
            <select
              value={ticket.priority}
              onChange={(e) => onUpdate(ticket.id, { priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <label className="field-label">Deadline</label>
            <input
              type="date"
              value={ticket.deadline || ''}
              onChange={(e) => onUpdate(ticket.id, { deadline: e.target.value })}
            />

            <label className="field-label">Labels</label>
            <input
              value={labelsInput}
              placeholder="comma, separated"
              onChange={(e) => setLabelsInput(e.target.value)}
              onBlur={handleLabelsBlur}
            />

            <button className="delete-btn" onClick={() => onDelete(ticket.id)}>
              Delete ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
