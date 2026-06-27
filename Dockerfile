# Multi-language image: Node.js runs the Express API, Python runs the
# ingestion pipeline as a subprocess triggered by that API.
FROM node:20-slim

# Install Python and pip alongside Node, since Render's native Node
# runtime doesn't include Python at all.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Backend (Node) setup ---
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# --- Python pipeline setup ---
COPY python-pipeline/requirements.txt ./python-pipeline/
RUN pip3 install --break-system-packages --no-cache-dir -r python-pipeline/requirements.txt

# --- Copy the rest of the source code ---
COPY backend/ ./backend/
COPY python-pipeline/ ./python-pipeline/

WORKDIR /app/backend

# Render injects PORT at runtime; the app must bind to 0.0.0.0:$PORT
EXPOSE 10000

CMD ["node", "server.js"]