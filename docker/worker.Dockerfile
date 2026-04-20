# We use the official Playwright image to ensure browsers are installed
FROM mcr.microsoft.com/playwright:v1.59.1-jammy
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps
COPY . .
CMD ["node", "apps/worker-node/index.js"]