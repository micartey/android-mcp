import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new Server(
  {
    name: "android-control-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Executes an ADB command and returns the output.
 */
function runAdb(command: string): string {
  try {
    return execSync(`adb ${command}`, { encoding: "utf8" });
  } catch (error: any) {
    throw new Error(`ADB command failed: ${error.message}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "take_screenshot",
        description:
          "Takes a screenshot of the Android device and returns it as a PNG image",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_ui_elements",
        description:
          "Returns the current UI hierarchy from the Android device as XML",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "swipe",
        description: "Swipes on the Android device screen",
        inputSchema: {
          type: "object",
          properties: {
            x1: { type: "number" },
            y1: { type: "number" },
            x2: { type: "number" },
            y2: { type: "number" },
            duration: {
              type: "number",
              description: "Duration in milliseconds (optional)",
            },
          },
          required: ["x1", "y1", "x2", "y2"],
        },
      },
      {
        name: "touch",
        description:
          "Taps on the Android device screen at the specified coordinates",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
          },
          required: ["x", "y"],
        },
      },
      {
        name: "launch_app",
        description:
          "Launches an app on the Android device using its component name (e.g., com.android.settings/.Settings)",
        inputSchema: {
          type: "object",
          properties: {
            app: { type: "string" },
          },
          required: ["app"],
        },
      },
      {
        name: "list_apps",
        description: "Lists all installed packages on the Android device",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              enum: ["third-party", "system", "all"],
              description: "Filter the type of apps to list (default: all)",
            },
          },
        },
      },
      {
        name: "launch_app_with_data",
        description:
          "Launches a specific app component with a data URI (e.g., Chrome to a specific website)",
        inputSchema: {
          type: "object",
          properties: {
            app: {
              type: "string",
              description:
                "The component name (e.g., com.android.chrome/com.google.android.apps.chrome.Main)",
            },
            data: {
              type: "string",
              description: "The data URI/URL (e.g., https://www.google.com)",
            },
          },
          required: ["app", "data"],
        },
      },
      {
        name: "type",
        description: "Types text into the Android device",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
          },
          required: ["text"],
        },
      },
      {
        name: "press_enter",
        description: "Presses the Enter key on the Android device",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "press_backspace",
        description: "Presses the Backspace key on the Android device",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "sleep",
        description: "Sleeps for a set amount of time in milliseconds",
        inputSchema: {
          type: "object",
          properties: {
            ms: {
              type: "number",
              description: "Duration in milliseconds",
            },
          },
          required: ["ms"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "take_screenshot": {
        const screenshot = execSync("adb exec-out screencap -p");
        return {
          content: [
            {
              type: "image",
              data: screenshot.toString("base64"),
              mimeType: "image/png",
            },
          ],
        };
      }

      case "get_ui_elements": {
        runAdb("shell uiautomator dump");
        runAdb("pull /sdcard/window_dump.xml window_dump.xml");
        const xmlContent = readFileSync("window_dump.xml", "utf8");
        return {
          content: [
            {
              type: "text",
              text: xmlContent,
            },
          ],
        };
      }

      case "swipe": {
        const { x1, y1, x2, y2, duration } = args as any;
        const durationArg = duration ? ` ${duration}` : "";
        runAdb(`shell input swipe ${x1} ${y1} ${x2} ${y2}${durationArg}`);
        return {
          content: [
            {
              type: "text",
              text: `Swiped from (${x1}, ${y1}) to (${x2}, ${y2})`,
            },
          ],
        };
      }

      case "touch": {
        const { x, y } = args as any;
        runAdb(`shell input tap ${x} ${y}`);
        return {
          content: [
            {
              type: "text",
              text: `Touched at (${x}, ${y})`,
            },
          ],
        };
      }

      case "launch_app": {
        const { app } = args as any;
        runAdb(`shell am start -n ${app}`);
        return {
          content: [
            {
              type: "text",
              text: `Launched app: ${app}`,
            },
          ],
        };
      }

      case "list_apps": {
        const { filter } = (args as any) || {};
        let filterArg = "";
        if (filter === "third-party") filterArg = " -3";
        else if (filter === "system") filterArg = " -s";

        const output = runAdb(`shell pm list packages${filterArg}`);
        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "launch_app_with_data": {
        const { app, data } = args as any;
        runAdb(
          `shell am start -a android.intent.action.VIEW -n ${app} -d "${data}"`,
        );
        return {
          content: [
            {
              type: "text",
              text: `Launched app ${app} with data: ${data}`,
            },
          ],
        };
      }

      case "type": {
        const { text } = args as any;
        // Escape spaces for the adb shell input command
        const escapedText = text.replace(/ /g, "%s");
        runAdb(`shell input text ${escapedText}`);
        return {
          content: [
            {
              type: "text",
              text: `Typed: ${text}`,
            },
          ],
        };
      }

      case "press_enter": {
        runAdb("shell input keyevent 66");
        return {
          content: [
            {
              type: "text",
              text: "Pressed Enter",
            },
          ],
        };
      }

      case "press_backspace": {
        runAdb("shell input keyevent 67");
        return {
          content: [
            {
              type: "text",
              text: "Pressed Backspace",
            },
          ],
        };
      }

      case "sleep": {
        const { ms } = args as any;
        await new Promise((resolve) => setTimeout(resolve, ms));
        return {
          content: [
            {
              type: "text",
              text: `Slept for ${ms}ms`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

const app = express();
let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  console.log("New SSE connection established");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send("No active transport");
  }
});

const PORT = 3134;
app.listen(PORT, () => {
  console.log(`Android MCP Server running on http://localhost:${PORT}/sse`);
});
