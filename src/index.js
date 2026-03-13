require('dotenv').config();

const { createApp } = require('./app/createApp');
const { env } = require('./app/config/env');

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend running at http://localhost:${env.port}`);
});
