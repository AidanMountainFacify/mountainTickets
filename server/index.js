const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Mountain Tickets server running at http://localhost:${PORT}`);
});
