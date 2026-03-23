#!/usr/bin/env node
// Finds an available port starting from 3000, then launches `next dev` on it.
const { createServer } = require("net");
const { spawn } = require("child_process");

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findPort(start = 3000, limit = 10) {
  for (let port = start; port < start + limit; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found between ${start} and ${start + limit - 1}`);
}

async function main() {
  const startPort = parseInt(process.env.PORT ?? "3000", 10);
  const port = await findPort(startPort);

  if (port !== startPort) {
    console.log(`\nPort ${startPort} is in use — starting on port ${port} instead.\n`);
  }

  const child = spawn("next", ["dev", "-p", String(port)], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
