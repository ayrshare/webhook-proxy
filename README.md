![header image](https://github.com/ayrshare/webhook-proxy/assets/29169429/ffc081d7-13cf-49a1-bd81-cc480c5a0208)

# Webhook Proxy Tool

## Overview

This Webhook Proxy Tool is a Node.js application designed to create an on-the-fly publicly accessible URL for testing webhooks. It acts as a webhook proxy or webhook relay, forwarding requests to a specified local URL. This is particularly useful for testing webhook integrations locally without the need to open ports or modify network configurations. Furthermore, you can log the calls both at the command line and in a file.

## Features

- **Local Webhook Forwarding**: Forwards requests received on the public URL to a specified local URL.
- **Command Line Logging**: Provides real-time logging of all incoming requests directly in the command line.
- **File Logging**: Logs all requests to a `webhook.log` file for further analysis and record-keeping.
- **Port Customization**: Allows specifying a custom port for the proxy server.
- **Log Management**: Option to clear existing logs and start fresh upon starting the tool.
- **Public URL Generation**: Uses LocalTunnel to expose your local server to the internet.

## NPM Install

`npm install -g webhook-proxy`

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (version 18 or higher)

## Runtime Options

- `--webhook` [local webhook URL]: Specifies the local URL to forward requests to.
- `--log` Enables logging of requests to the console and log file.
- `--port` [number]: Sets the port for the proxy server (default is 3000).
- `--clear-logs` Clears existing logs before starting the tool.
  
Once running, the tool will display the public URL. Use this URL for webhook testing.

## Run Example

`node webhook-proxy.js --webhook http://localhost:8000/webhook/ --log --port 3002 --clear-logs`

## Contact

- Website: [Ayrshare](https://www.ayrshare.com)
- Blog Article on [Webhook Proxy Tool](https://www.ayrshare.com/streamlining-webhook-development-how-a-webhook-proxy-tool-can-transform-your-workflow/)
