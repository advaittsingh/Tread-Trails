import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`@tread-trails/backend listening on http://localhost:${env.PORT}`);
  console.log(`  Health: http://localhost:${env.PORT}/health`);
});
