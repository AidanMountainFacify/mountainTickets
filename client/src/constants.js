export const PRIORITIES = [
  { id: 'none', label: 'No priority', color: '#8a8f98' },
  { id: 'low', label: 'Low', color: '#4c9aff' },
  { id: 'medium', label: 'Medium', color: '#e2a336' },
  { id: 'high', label: 'High', color: '#e2683f' },
  { id: 'urgent', label: 'Urgent', color: '#e2483f' },
];

export function priorityInfo(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[0];
}

export const WORKSPACE_COLORS = [
  '#5e6ad2',
  '#4c9aff',
  '#26b5ce',
  '#4cb782',
  '#e2a336',
  '#e2683f',
  '#e2483f',
  '#c34cd9',
];
