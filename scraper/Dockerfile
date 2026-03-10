FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install Playwright browsers
RUN npx playwright install chromium

EXPOSE 4000

CMD ["node", "dist/index.js"]
