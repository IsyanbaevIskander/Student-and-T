FROM node:20-alpine

WORKDIR /frontend

# Copy package and install
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Expose Vite's default dev port (5173 by default)
EXPOSE 5173

# Run the dev server and bind to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
