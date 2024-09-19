# Brandmeister Network Data Viewer

This project is a web application that displays real-time data from the Brandmeister network. It consists of a Node.js backend server and a React frontend client.

## Features

- Real-time data display from the Brandmeister network
- Filtering options by time range, continent, and country
- Admin page for managing CountryTalkgroup entries
- Dockerized setup for easy deployment

## Project Structure

The project is divided into two main components:

1. Server (Node.js)
2. Client (React)

### Server

The server is built with Node.js and uses the following key technologies:

- Express.js for the web server
- Prisma as the ORM
- Socket.io for real-time communication
- JSON Web Tokens (JWT) for authentication

### Client

The client is a React application and uses:

- Material-UI for the user interface
- Chart.js for data visualization
- Axios for HTTP requests
- Socket.io-client for real-time updates

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/brandmeister-network-viewer.git
   cd brandmeister-network-viewer
   ```

2. Copy the example environment file and update it with your settings:
   ```
   cp .env.example .env
   ```

3. Generate values for ADMIN_PASSWORD and JWT_SECRET:

   For ADMIN_PASSWORD:
   ```
   node -e "console.log(require('crypto').createHash('sha256').update('your-admin-password').digest('hex'))"
   ```
   Replace 'your-admin-password' with your desired admin password. Copy the output and paste it as the value for ADMIN_PASSWORD in your .env file.

   For JWT_SECRET:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and paste it as the value for JWT_SECRET in your .env file.

4. Set up persistent storage for the database:

   To ensure that your database data persists across container restarts, you need to map the database file to a volume on your host system. 

   a. Create a directory on your host system to store the database:
      ```
      mkdir -p /path/on/host/bm-lh-data
      ```
      Replace `/path/on/host` with the actual path where you want to store the data.

   b. Update the `docker-compose.yml` file to include a volume for the database. Add the following under the `volumes` section of the `server` service:
      ```yaml
      volumes:
        - /path/on/host/bm-lh-data:/usr/src/app/data
      ```
      Again, replace `/path/on/host` with the actual path you chose.

   c. Update the `DATABASE_URL` in your `.env` file to point to this location:
      ```
      DATABASE_URL=file:/usr/src/app/data/bm-lh.db
      ```

   This setup ensures that the database file is stored on your host system and persists even if the Docker container is removed or recreated.

5. Build and start the Docker containers:
   ```
   docker-compose up --build
   ```

6. The application should now be running:
   - Server API: http://localhost:5001
   - Client: http://localhost

## Development

For local development without Docker:

1. Install server dependencies:
   ```
   npm install
   ```

2. Install client dependencies:
   ```
   cd client
   npm install
   ```

3. Start the server:
   ```
   npm run start
   ```

4. In a new terminal, start the client:
   ```
   cd client
   npm start
   ```

## Environment Variables

Key environment variables include:

- `PORT`: The port on which the server will run (default: 5001)
- `DATABASE_URL`: URL for the SQLite database
- `JWT_SECRET`: Secret key for JWT authentication (generate as shown in Setup and Installation)
- `ADMIN_PASSWORD`: SHA-256 hashed password for admin access (generate as shown in Setup and Installation)
- `CLIENT_URL`: URL of the client application
- `REACT_APP_API_URL`: URL of the server API (for the client)
- `REACT_APP_MATOMO_URL`: URL for Matomo analytics
- `REACT_APP_MATOMO_SITE_ID`: Site ID for Matomo analytics

Refer to `.env.example` for a complete list of required environment variables.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Brandmeister Network for providing the data
- All contributors who have helped with the project
- Claude Coder by Kodu (Subscribe at https://kodu.ai/r/volker) for assisting me in creating the application in a bit less than a day, starting from an existing idea. 
