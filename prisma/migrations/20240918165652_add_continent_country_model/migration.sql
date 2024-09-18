-- CreateTable
CREATE TABLE "ContinentCountry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Continent_name" TEXT NOT NULL,
    "Continent_code" TEXT NOT NULL,
    "Country_name" TEXT NOT NULL,
    "Two_Letter_country_code" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContinentCountry_Country_name_key" ON "ContinentCountry"("Country_name");
