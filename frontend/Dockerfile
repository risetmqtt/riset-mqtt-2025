# Use a Node.js image with npm pre-installed for building assets
FROM node:current-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run build

EXPOSE 3002

# Use a minimal image for the final runtime
# This assumes your application artifacts are moved to the final stage
# (This simple example just shows the build part)
CMD ["npm", "start"] 
