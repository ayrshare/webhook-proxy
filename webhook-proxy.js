import express from "express";
import localtunnel from "localtunnel";
import { appendFileSync, writeFileSync, existsSync } from "fs";
import { nanoid } from "nanoid";
import { createProxyMiddleware } from "http-proxy-middleware";

const LOG_FILE = "webhook.log";

const args = process.argv.slice(2);
const shouldLog = args.includes("--log");
const portIndex = args.indexOf("--port");
const webhookIndex = args.indexOf("--webhook");
const shouldClearLogs = args.indexOf("--clear-logs");

const specifiedPort =
  portIndex !== -1 && args[portIndex + 1]
    ? parseInt(args[portIndex + 1], 10)
    : 3000;
const localUrl = webhookIndex !== -1 ? args[webhookIndex + 1] : null;

if (isNaN(specifiedPort)) {
  console.error("Invalid port number.");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logEntry = (message) => {
  if (shouldLog) {
    console.log(message);
    appendFileSync(LOG_FILE, message);
  }
};

if (localUrl) {
  const proxyMiddleware = createProxyMiddleware({
    target: localUrl,
    changeOrigin: true,
    logLevel: shouldLog ? "debug" : "silent",
    onProxyReq: (proxyReq, req) => {
      if (
        req.body &&
        req.method === "POST" &&
        proxyReq.getHeader("Content-Type") === "application/json"
      ) {
        const processId = nanoid();
        req.processId = processId;

        const bodyData = JSON.stringify(req.body);
        logEntry(
          `Request Process Id: ${processId}, Request to ${req.method} ${req.originalUrl} from ${localUrl}\n> ${bodyData}\n`
        );

        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });
      proxyRes.on("end", () => {
        logEntry(
          `Response Process Id: ${req.processId}, Response from ${localUrl} to ${req.method} ${req.originalUrl}: Status ${proxyRes.statusCode}\n> ${responseBody}\n`
        );
      });
    }
  });

  app.use("/", proxyMiddleware);
} else {
  console.log("No target URL provided; running as a simple server.");
}

if (shouldClearLogs !== -1) {
  if (existsSync(LOG_FILE)) {
    console.log("Clearing logs...");
    writeFileSync(LOG_FILE, ""); // Clears the log file
  }
}

const startProxy = async () => {
  app.listen(specifiedPort, async () => {
    try {
      const tunnel = await localtunnel({ port: specifiedPort });
      console.log(`\nWebhook proxy is now listening at ${tunnel.url}\n`);
      if (localUrl) {
        console.log(
          `All requests on this endpoint will be forwarded to your webhook url: ${localUrl}`
        );
      } else {
        console.log(
          "No wehbook URL provided; requests will be logged but not forwarded.\n"
        );
      }

      tunnel.on("close", () => {
        console.log("Tunnel closed");
      });
    } catch (error) {
      console.error("Error starting localtunnel:", error);
      process.exit(1);
    }
  });
};

startProxy();
