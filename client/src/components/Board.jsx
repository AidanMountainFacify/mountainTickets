import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import Column from './Column';
import AddColumnTile from './AddColumnTile';

const columnDroppableId = (statusId) => `col-${statusId}`;

export default function Board({
  tickets,
  statuses,
  setTickets,
  onOpenTicket,
  onAddTicket,
  onPersist,
  workspacesById,
  onRenameStatus,
  onDeleteStatus,
  onAddStatus,
  collapsedStatusIds,
  onToggleCollapse,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const byStatus = (statusId) =>
    tickets.filter((t) => t.status_id === statusId).sort((a, b) => a.position - b.position);

  function findContainer(id) {
    const ticket = tickets.find((t) => t.id === id);
    if (ticket) return ticket.status_id;
    if (typeof id === 'string' && id.startsWith('col-')) {
      const statusId = Number(id.slice(4));
      if (statuses.some((s) => s.id === statusId)) return statusId;
    }
    return null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overContainer = findContainer(over.id);
    const activeContainer = findContainer(activeId);
    if (!overContainer || !activeContainer) return;

    const activeTicket = tickets.find((t) => t.id === activeId);
    if (!activeTicket) return;

    const destTickets = byStatus(overContainer).filter((t) => t.id !== activeId);
    let overIndex = destTickets.findIndex((t) => t.id === over.id);
    if (overIndex === -1) overIndex = destTickets.length;

    const before = destTickets[overIndex - 1];
    const after = destTickets[overIndex];
    let newPosition;
    if (!before && !after) newPosition = 1;
    else if (!before) newPosition = after.position - 1;
    else if (!after) newPosition = before.position + 1;
    else newPosition = (before.position + after.position) / 2;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status_id: overContainer, position: newPosition } : t
      )
    );

    onPersist(activeId, { status_id: overContainer, position: newPosition });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="board">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            droppableId={columnDroppableId(status.id)}
            tickets={byStatus(status.id)}
            onOpenTicket={onOpenTicket}
            onAddTicket={onAddTicket}
            workspacesById={workspacesById}
            onRename={onRenameStatus}
            onDelete={onDeleteStatus}
            canDelete={statuses.length > 1}
            collapsed={collapsedStatusIds.has(status.id)}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
        <AddColumnTile onAdd={onAddStatus} />
      </div>
    </DndContext>
  );
}
