-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "defaultShiftStart" TEXT NOT NULL DEFAULT '07:00',
    "defaultShiftEnd" TEXT NOT NULL DEFAULT '15:30',
    "overtimeThreshold" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "lunchDuration" INTEGER NOT NULL DEFAULT 30,
    "punchRounding" TEXT NOT NULL DEFAULT 'None',
    "gpsTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowEmployeePunchEdits" BOOLEAN NOT NULL DEFAULT false,
    "requireClockOutNotes" BOOLEAN NOT NULL DEFAULT false,
    "clockInReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "missedClockOutNotification" BOOLEAN NOT NULL DEFAULT false,
    "overtimeNotification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
