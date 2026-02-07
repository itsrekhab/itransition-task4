import "reflect-metadata";

import app from "@/app.js";
import { AppDataSource } from "@/data-source.js";
import { env } from "@/env.js";

const port = env.PORT;
const server = app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

try {
  AppDataSource.initialize();
}
catch (error) {
  console.error("Failed to initialize database:", error);
}

server.on("error", (err) => {
  if ("code" in err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`,
    );
  }
  else {
    console.error("Failed to start server:", err);
  }
  process.exit(1);
});
