FROM node:20-alpine

# Install libc6-compat (required for Prisma binaries to run on Alpine Linux)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files and prisma schema first for caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

COPY . .

# Generate the Prisma Client specifically for the Alpine container architecture
RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]