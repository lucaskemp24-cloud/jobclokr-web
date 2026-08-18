-- Create the new JobClokr platform administrator table.
CREATE TABLE "PlatformAdmin" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "loginName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- Platform admin email must be unique when present.
CREATE UNIQUE INDEX "PlatformAdmin_email_key"
ON "PlatformAdmin"("email");

-- Platform admin login names must be unique.
CREATE UNIQUE INDEX "PlatformAdmin_loginName_key"
ON "PlatformAdmin"("loginName");

-- Copy Gio's existing login credentials into the new
-- platform administrator table BEFORE changing Employee.
INSERT INTO "PlatformAdmin" (
    "firstName",
    "lastName",
    "email",
    "loginName",
    "passwordHash",
    "mustChangePassword",
    "active",
    "createdAt",
    "updatedAt"
)
SELECT
    "firstName",
    "lastName",
    "email",
    "loginName",
    "passwordHash",
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Employee"
WHERE LOWER("loginName") = 'gio'
  AND "passwordHash" IS NOT NULL
  AND "isPlatformAdmin" = true;

-- Platform administration is now separate from company employees.
ALTER TABLE "Employee"
DROP COLUMN "isPlatformAdmin";