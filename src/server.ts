import http from "http";
import app from "./app";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION:", error);

  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);

  process.exit(1);
});