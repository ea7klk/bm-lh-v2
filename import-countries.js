const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const prisma = new PrismaClient();

const CSV_URL = 'https://raw.githubusercontent.com/dbouquin/IS_608/master/NanosatDB_munging/Countries-Continents.csv';

async function importCountries() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Check if countries have already been imported
    const countryCount = await prisma.countries.count();
    if (countryCount > 0) {
      console.log('Countries have already been imported. Skipping import.');
      return;
    }

    // Fetch CSV data
    const response = await axios.get(CSV_URL);
    const csvData = response.data;

    // Parse CSV data
    const results = [];
    await new Promise((resolve, reject) => {
      Readable.from(csvData)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert data into the database
    for (const row of results) {
      await prisma.countries.create({
        data: {
          continent: row.Continent,
          country: row.Country,
        },
      });
    }

    console.log(`Successfully imported ${results.length} countries.`);
  } catch (error) {
    console.error('Error importing countries:', error);
    if (error.code === 'P2021') {
      console.error('The "Countries" table does not exist. Please run the Prisma migrations.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

importCountries();