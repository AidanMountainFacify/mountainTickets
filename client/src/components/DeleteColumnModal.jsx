export default function DeleteColumnModal({ status, ticketCount, otherStatuses, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-column-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Delete "{status.label}"</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="delete-column-message">
          {ticketCount} ticket{ticketCount === 1 ? '' : 's'} will move to:
        </p>

        <div className="delete-column-targets">
          {otherStatuses.map((s) => (
            <button key={s.id} className="secondary-btn" onClick={() => onConfirm(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="new-ticket-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
