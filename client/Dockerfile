# Use an official Node runtime as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Create a script to inject environment variables
RUN echo '#!/bin/sh\n\
echo "window.env = {" > /usr/src/app/build/env-config.js\n\
echo "  REACT_APP_API_URL: \"$REACT_APP_API_URL\"," >> /usr/src/app/build/env-config.js\n\
echo "}" >> /usr/src/app/build/env-config.js\n\
serve -s build' > /usr/src/app/start.sh

# Make the script executable
RUN chmod +x /usr/src/app/start.sh

# Start the application
CMD ["/usr/src/app/start.sh"]