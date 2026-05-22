FROM node:20-alpine

WORKDIR /app

# 1. Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# 2. Copy the rest of the application files
COPY . .

# 3. Build the Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 4. Expose the port and configure host
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

# 5. Start Next.js server directly
CMD ["npm", "start"]
