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

3. Build and start the Docker containers:
   ```
   docker-compose up --build
   ```

4. The application should now be running:
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

- `DATABASE_URL`: URL for the SQLite database
- `JWT_SECRET`: Secret key for JWT authentication
- `ADMIN_PASSWORD`: Hashed password for admin access
- `REACT_APP_API_URL`: URL of the server API (for the client)

Refer to `.env.example` for a complete list of required environment variables.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Brandmeister Network for providing the data
- All contributors who have helped with the project
- Claude Coder by Kodu (Subscribe at https://kodu.ai/r/volker) for assisting me in creating the application in a bit less than a day, starting from an existing idea. 
