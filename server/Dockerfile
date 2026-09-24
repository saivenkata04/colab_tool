FROM node:20-alpine

# Install Python 3 for the integrated cloud terminal runner
RUN apk add --no-cache python3 py3-pip make g++

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared ./shared

RUN npm install

COPY . .

# Generate Prisma client and build both backend and frontend
RUN npm run build

WORKDIR /app/server

EXPOSE 5000 8080

CMD ["node", "dist/server.js"]
