import express from "express";
import localtunnel from "localtunnel";
import { appendFileSync, writeFileSync, existsSync } from "fs";
import { nanoid } from "nanoid";

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

if (!localUrl && webhookIndex !== -1) {
  console.error("Please specify a URL after --webhook.");
  process.exit(1);
}

if (shouldClearLogs !== -1) {
  if (existsSync(LOG_FILE)) {
    console.log("Clearing logs...");
    writeFileSync(LOG_FILE, ""); // Clears the log file
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prettyPrintJSON = (input) => {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch (e) {
    return input; // Return the original input if it's not JSON
  }
};

const logRequest = (req, body, id) => {
  const prettyBody = prettyPrintJSON(body);
  const logEntry = `Process Id: ${id}\nReceived at ${new Date().toISOString()}\nHTTP Method: ${
    req.method
  }\nQuery: ${req.originalUrl}\nBody:\n${prettyBody}\n`;
  if (shouldLog) {
    console.log(logEntry);
    appendFileSync(LOG_FILE, logEntry);
  }
};

app.all("*", async (req, res) => {
  let options;
  try {
    const requestBody = JSON.stringify(req.body);
    const id = nanoid();
    logRequest(req, requestBody, id);

    if (localUrl) {
      const { method, headers } = req;
      options = Object.assign(
        {
          method,
          headers
        },
        method.toUpperCase() !== "GET" && requestBody && { body: requestBody }
      );
      const response = await fetch(localUrl, options);

      const responseBody = await response.text();
      if (shouldLog) {
        console.log(`Process Id: ${id}\nWebhook Response:\n${responseBody}\n`);
        appendFileSync(LOG_FILE, responseBody);
      }

      res.status(response.status).send(responseBody);
    } else {
      res.status(200).send("Request logged");
    }
  } catch (e) {
    console.error("Error forwarding the request:", localUrl, options, e);
    res.status(500).send("Error forwarding the request");
  }
});

const startProxy = async () => {
  app.listen(specifiedPort, async () => {
    try {
      const tunnel = await localtunnel({ port: specifiedPort });
      console.log(`Webhook proxy is now listening at ${tunnel.url}`);
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