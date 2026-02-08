FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    firefox-esr \
    mpv \
    ffmpeg \
    pulseaudio \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Geckodriver for Selenium
RUN wget -q https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz \
    && tar -xzf geckodriver-v0.36.0-linux64.tar.gz -C /usr/local/bin \
    && rm geckodriver-v0.36.0-linux64.tar.gz \
    && chmod +x /usr/local/bin/geckodriver

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build \
    && npm prune --omit=dev

# Xvfb will run on :99
ENV DISPLAY=:99

# Start script: Xvfb + app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
