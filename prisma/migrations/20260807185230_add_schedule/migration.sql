-- CreateEnum
CREATE TYPE "AssignmentPriority" AS ENUM ('NORMAL', 'HIGH', 'EMERGENCY');

-- CreateTable
CREATE TABLE "ScheduleAssignment" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "priority" "AssignmentPriority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleAssignmentEmployee" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,

    CONSTRAINT "ScheduleAssignmentEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleAssignment_companyId_date_idx" ON "ScheduleAssignment"("companyId", "date");

-- CreateIndex
CREATE INDEX "ScheduleAssignment_projectId_idx" ON "ScheduleAssignment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleAssignment_companyId_projectId_date_key" ON "ScheduleAssignment"("companyId", "projectId", "date");

-- CreateIndex
CREATE INDEX "ScheduleAssignmentEmployee_employeeId_idx" ON "ScheduleAssignmentEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleAssignmentEmployee_assignmentId_employeeId_key" ON "ScheduleAssignmentEmployee"("assignmentId", "employeeId");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDocument_employeeId_idx" ON "ProjectDocument"("employeeId");

-- CreateIndex
CREATE INDEX "ProjectDocument_createdAt_idx" ON "ProjectDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignmentEmployee" ADD CONSTRAINT "ScheduleAssignmentEmployee_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ScheduleAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignmentEmployee" ADD CONSTRAINT "ScheduleAssignmentEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
