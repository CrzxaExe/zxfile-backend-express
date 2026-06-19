import "dotenv/config";
import { app } from "./src";
import { Database } from "./src/utils/Database";
import { Terminal } from "./src/utils/Terminal";

/**
 * Application port
 */
const port: number = parseInt(process.env.PORT!) || 3000;
/**
 * Application name
 */
const title: string = process.env.APP_NAME ?? "API";

// Validate required env variables
const requiredEnvs = [
  "APP_NAME",
  "PORT",
  "MONGO_URI",
  "DRIVE_CLIENT",
  "DRIVE_SECRET",
  "DRIVE_REFRESH_TOKEN",
];

for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`[ENV ERROR] ${key} is required but missing!`);
    process.exit(1);
  }
}

app.listen(port, () => {
  process.title = title;
  Terminal.log("App started on port", port);
});

Database.Connect(process.env.MONGO_URI!);

process.on("unhandledRejection", (reason) => {
  Terminal.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (error) => {
  Terminal.error("Uncaught Exception:", error);
});
