// Importing required modules
const express = require('express');    // For handling HTTP requests
const WebSocket = require('ws');      // For WebSocket server functionality
const http = require('http');         // Built-in HTTP module to create a server
const path = require('path');         // To serve static files like HTML

// Initialize express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Store clients for each workspace (channel)
const workspaces = {};

// Function to broadcast messages to a specific workspace
function broadcastToWorkspace(workspaceId, message) {
  if (workspaces[workspaceId]) {
    workspaces[workspaceId].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  let workspaceId = null;

  // Listen for messages from clients
  ws.on('message', (data) => {
    const messageData = JSON.parse(data);

    // Handle workspace join
    if (messageData.type === 'join') {
      workspaceId = messageData.workspaceId;

      // Initialize workspace if not already done
      if (!workspaces[workspaceId]) {
        workspaces[workspaceId] = [];
      }

      // Add user to workspace
      workspaces[workspaceId].push(ws);
      console.log(`Client joined workspace: ${workspaceId}`);
    }

    // Handle message sending
    if (messageData.type === 'message' && workspaceId) {
      console.log(`Broadcasting message to workspace: ${workspaceId}`);
      broadcastToWorkspace(workspaceId, JSON.stringify({
        user: messageData.user,
        message: messageData.message,
      }));
    }
  });

  // Handle WebSocket disconnection
  ws.on('close', () => {
    if (workspaceId && workspaces[workspaceId]) {
      const index = workspaces[workspaceId].indexOf(ws);
      if (index > -1) {
        workspaces[workspaceId].splice(index, 1);
        console.log(`Client left workspace: ${workspaceId}`);
      }
    }
  });
});

// Serve the index.html file when visiting http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up HTTP server to listen on a port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
