// Suppress deprecation warnings
process.env.NODE_NO_WARNINGS = '1';

const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const http = require('http');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = `file:${path.join(__dirname, 'data', 'bm-lh.db')}`;

const prisma = new PrismaClient();

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();

// Configure CORS
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));

// Create HTTP server
const httpServer = http.createServer(app);

// Create Socket.IO instance that works with the server
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

console.log(`WebSocket server running on port ${PORT}`);

const brandmeisterSocket = ioClient('https://api.brandmeister.network', {
  path: '/lh/socket.io'
});

brandmeisterSocket.on('connect', () => {
  console.log('Connected to Brandmeister network');
});

function parseFloat(value) {
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

let insertCount = 0;

async function cleanupOldRecords() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.lh.deleteMany({
    where: {
      timestamp: {
        lt: twentyFourHoursAgo
      }
    }
  });
  console.log(`Cleaned up ${count} records older than 24 hours`);
}

async function importTalkgroups() {
  const results = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('talkgroups.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of results) {
    await prisma.countryTalkgroup.upsert({
      where: { talkgroup: row.Talkgroup },
      update: {
        country: row.Country,
        name: row.Name
      },
      create: {
        country: row.Country,
        talkgroup: row.Talkgroup,
        name: row.Name
      },
    });
  }

  console.log('Talkgroup data imported successfully');
}

async function importContinentCountry() {
  const results = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('continent_country.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of results) {
    if (row.Country_Name && row.Continent_Name && row.Continent_Code && row.Two_Letter_Country_Code) {
      try {
        await prisma.continentCountry.upsert({
          where: { Country_name: row.Country_Name },
          update: {
            Continent_name: row.Continent_Name,
            Continent_code: row.Continent_Code,
            Two_Letter_country_code: row.Two_Letter_Country_Code
          },
          create: {
            Continent_name: row.Continent_Name,
            Continent_code: row.Continent_Code,
            Country_name: row.Country_Name,
            Two_Letter_country_code: row.Two_Letter_Country_Code
          },
        });
      } catch (error) {
        console.error(`Error upserting country ${row.Country_Name}:`, error);
      }
    } else {
      console.warn('Skipping invalid row:', row);
    }
  }

  console.log('Continent-Country data imported successfully');
}

brandmeisterSocket.on('mqtt', async (rawData) => {
  try {
    if (typeof rawData !== 'object' || !rawData.payload) {
      throw new Error('Invalid data format');
    }

    const payloadData = JSON.parse(rawData.payload);
    
    // Calculate Duration
    const duration = payloadData.Stop && payloadData.Start ? payloadData.Stop - payloadData.Start : null;

    // Ignore data based on specified conditions
    if (payloadData.Stop === 0 || payloadData.Stop === null ||
        payloadData.DestinationID === 8 || payloadData.DestinationID === 9 ||
        (payloadData.DestinationCall && payloadData.DestinationCall !== '') ||
        duration === null || duration < 2) {
      // console.log('Ignoring data: Conditions not met');
      return;
    }
    
    // Process the data
    const processedData = {
      timestamp: new Date(),
      linkName: payloadData.LinkName || null,
      slot: parseFloat(payloadData.Slot),
      sourceId: parseFloat(payloadData.SourceID),
      destinationId: parseFloat(payloadData.DestinationID),
      route: payloadData.Route || null,
      linkCall: payloadData.LinkCall || null,
      sessionType: parseFloat(payloadData.SessionType),
      sourceName: payloadData.SourceName || null,
      destinationCall: payloadData.DestinationCall || null,
      destinationName: payloadData.DestinationName || null,
      state: parseFloat(payloadData.State),
      start: parseFloat(payloadData.Start),
      stop: parseFloat(payloadData.Stop),
      rssi: payloadData.RSSI || null,
      ber: parseFloat(payloadData.BER),
      reflectorId: parseFloat(payloadData.ReflectorID),
      linkType: parseFloat(payloadData.LinkType),
      callTypes: Array.isArray(payloadData.CallTypes) ? payloadData.CallTypes.join(',') : null,
      lossCount: parseFloat(payloadData.LossCount),
      totalCount: parseFloat(payloadData.TotalCount),
      master: parseFloat(payloadData.Master),
      talkerAlias: payloadData.TalkerAlias || null,
      flagSet: parseFloat(payloadData.FlagSet),
      event: payloadData.Event || null,
      linkTypeName: payloadData.LinkTypeName || null,
      contextId: parseFloat(payloadData.ContextID),
      sessionId: payloadData.SessionID || null,
      sourceCall: payloadData.SourceCall || null,
      duration: parseFloat(duration)
    };

    // Insert data into database using Prisma
    const result = await prisma.lh.create({
      data: processedData
    });

    console.log(`Data inserted into database successfully, ID: ${result.id}`);

    insertCount++;
    if (insertCount % 100 === 0) {
      await cleanupOldRecords();
    }

    io.emit('brandmeisterData', processedData);
  } catch (error) {
    console.error('Error processing Brandmeister data:', error.message);
  }
});

brandmeisterSocket.on('error', (error) => {
  console.error('Brandmeister socket error:', error);
});

io.on('connection', async (socket) => {
  console.log('New client connected');

  socket.on('getContinents', async () => {
    try {
      const uniqueContinents = await prisma.continentCountry.findMany({
        distinct: ['Continent_name'],
        select: { Continent_name: true },
        orderBy: { Continent_name: 'asc' },
      });

      const continents = uniqueContinents.map(c => c.Continent_name);
      socket.emit('continents', continents);
    } catch (error) {
      console.error('Error fetching continents:', error);
      socket.emit('error', { message: 'Error fetching continents' });
    }
  });

  socket.on('getCountries', async ({ continent }) => {
    try {
      const countries = await prisma.continentCountry.findMany({
        where: { Continent_name: continent },
        select: { Country_name: true, Two_Letter_country_code: true },
        orderBy: { Country_name: 'asc' },
      });

      const formattedCountries = countries.map(c => ({
        label: c.Country_name,
        value: c.Two_Letter_country_code
      }));

      socket.emit('countries', formattedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      socket.emit('error', { message: 'Error fetching countries' });
    }
  });

  socket.on('getGroupedData', async ({ timeRange, continent, country }) => {
    try {
      const now = new Date();
      let startTime;

      switch (timeRange) {
        case '5m': startTime = new Date(now - 5 * 60 * 1000); break;
        case '15m': startTime = new Date(now - 15 * 60 * 1000); break;
        case '30m': startTime = new Date(now - 30 * 60 * 1000); break;
        case '1h': startTime = new Date(now - 60 * 60 * 1000); break;
        case '2h': startTime = new Date(now - 2 * 60 * 60 * 1000); break;
        case '6h': startTime = new Date(now - 6 * 60 * 60 * 1000); break;
        case '12h': startTime = new Date(now - 12 * 60 * 60 * 1000); break;
        case '24h': startTime = new Date(now - 24 * 60 * 60 * 1000); break;
        default: startTime = new Date(now - 5 * 60 * 1000); // Default to 5 minutes
      }

      let whereClause = {
        timestamp: {
          gte: startTime
        }
      };

      if (continent === 'Global') {
        const globalTalkgroups = await prisma.countryTalkgroup.findMany({
          where: { country: 'Global' },
          select: { talkgroup: true }
        });
        whereClause.destinationId = { in: globalTalkgroups.map(tg => parseInt(tg.talkgroup)) };
      } else if (country) {
        const countryTalkgroups = await prisma.countryTalkgroup.findMany({
          where: { country: country },
          select: { talkgroup: true }
        });
        whereClause.destinationId = { in: countryTalkgroups.map(tg => parseInt(tg.talkgroup)) };
      }

      const groupedData = await prisma.lh.groupBy({
        by: ['destinationName', 'destinationId'],
        where: whereClause,
        _count: {
          destinationName: true
        },
        _sum: {
          duration: true
        },
        orderBy: {
          _count: {
            destinationName: 'desc'
          }
        },
        take: 25
      });

      socket.emit('groupedData', groupedData);
    } catch (error) {
      console.error('Error fetching grouped data:', error);
      socket.emit('error', { message: 'Error fetching grouped data' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Middleware to check password
const checkPassword = (req, res, next) => {
  const { password } = req.body;
  if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// Routes for CountryTalkgroup management
app.post('/api/login', checkPassword, (req, res) => {
  const token = jwt.sign({ id: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });
  res.json({ auth: true, token: token });
});

app.get('/api/country-talkgroups', verifyToken, async (req, res) => {
  try {
    const talkgroups = await prisma.countryTalkgroup.findMany();
    res.json(talkgroups);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching talkgroups' });
  }
});

app.post('/api/country-talkgroups', verifyToken, async (req, res) => {
  try {
    const { country, talkgroup, name } = req.body;
    const newTalkgroup = await prisma.countryTalkgroup.create({
      data: { country, talkgroup, name }
    });
    res.json(newTalkgroup);
  } catch (error) {
    res.status(500).json({ error: 'Error creating talkgroup' });
  }
});

app.put('/api/country-talkgroups/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { country, talkgroup, name } = req.body;
    const updatedTalkgroup = await prisma.countryTalkgroup.update({
      where: { id: parseInt(id) },
      data: { country, talkgroup, name }
    });
    res.json(updatedTalkgroup);
  } catch (error) {
    res.status(500).json({ error: 'Error updating talkgroup' });
  }
});

app.delete('/api/country-talkgroups/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.countryTalkgroup.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Talkgroup deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting talkgroup' });
  }
});

// Start the server and import data
async function startServer() {
  try {
    await importTalkgroups();
    await importContinentCountry();
    console.log('Server started successfully');

    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Closed the database connection.');
  process.exit(0);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});