const express = require('express');
const path = require('node:path');
const ticketsRouter = require('./routes/tickets');
const workspacesRouter = require('./routes/workspaces');
const statusesRouter = require('./routes/statuses');
const dailyItemsRouter = require('./routes/dailyItems');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/workspaces', workspacesRouter);
  app.use('/api/statuses', statusesRouter);
  app.use('/api/daily-items', dailyItemsRouter);

  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}

module.exports = { createApp };
