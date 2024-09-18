-- CreateTable
CREATE TABLE "Lh" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "linkName" TEXT,
    "slot" REAL,
    "sourceId" REAL,
    "destinationId" REAL,
    "route" TEXT,
    "linkCall" TEXT,
    "sessionType" REAL,
    "sourceName" TEXT,
    "destinationCall" TEXT,
    "destinationName" TEXT,
    "state" REAL,
    "start" REAL,
    "stop" REAL,
    "rssi" TEXT,
    "ber" REAL,
    "reflectorId" REAL,
    "linkType" REAL,
    "callTypes" TEXT,
    "lossCount" REAL,
    "totalCount" REAL,
    "master" REAL,
    "talkerAlias" TEXT,
    "flagSet" REAL,
    "event" TEXT,
    "linkTypeName" TEXT,
    "contextId" REAL,
    "sessionId" TEXT,
    "sourceCall" TEXT,
    "duration" REAL
);

-- CreateTable
CREATE TABLE "Countries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "continent" TEXT NOT NULL,
    "country" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CountryTalkgroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "country" TEXT NOT NULL,
    "talkgroup" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryTalkgroup_talkgroup_key" ON "CountryTalkgroup"("talkgroup");
