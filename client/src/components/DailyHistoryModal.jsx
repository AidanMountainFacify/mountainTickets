import { useEffect, useState } from 'react';
import { api } from '../api';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyHistoryModal({ onClose, onOpenTicket }) {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDailyHistoryDates()
      .then((rows) => {
        setDates(rows);
        if (rows.length > 0) setSelectedDate(rows[0].date);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    api.listDailyHistoryForDate(selectedDate).then(setItems);
  }, [selectedDate]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Daily history</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {loading && <div className="comments-empty">Loading...</div>}
        {!loading && dates.length === 0 && (
          <div className="comments-empty">No completed days yet — finish something on today's list first.</div>
        )}

        {dates.length > 0 && (
          <div className="history-body">
            <div className="history-date-list">
              {dates.map((d) => (
                <button
                  key={d.date}
                  className={`history-date-btn ${d.date === selectedDate ? 'history-date-btn-active' : ''}`}
                  onClick={() => setSelectedDate(d.date)}
                >
                  {formatDate(d.date)}
                  <span className="checklist-progress">{d.count}</span>
                </button>
              ))}
            </div>
            <div className="history-items">
              {items.map((item) => (
                <div key={item.id} className="checklist-row">
                  <input type="checkbox" className="checklist-checkbox" checked disabled />
                  {item.kind === 'ticket' && item.ticket ? (
                    <button className="daily-item-ticket-link" onClick={() => onOpenTicket(item.ticket)}>
                      MT-{item.ticket.id} — {item.ticket.title}
                    </button>
                  ) : (
                    <span className="daily-item-text">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
