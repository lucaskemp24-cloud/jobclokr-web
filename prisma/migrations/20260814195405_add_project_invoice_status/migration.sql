-- CreateTable
CREATE TABLE "ProjectInvoiceStatus" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoicedAt" TIMESTAMP(3),
    "markedByEmployeeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvoiceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectInvoiceStatus_companyId_idx" ON "ProjectInvoiceStatus"("companyId");

-- CreateIndex
CREATE INDEX "ProjectInvoiceStatus_projectId_idx" ON "ProjectInvoiceStatus"("projectId");

-- CreateIndex
CREATE INDEX "ProjectInvoiceStatus_startDate_endDate_idx" ON "ProjectInvoiceStatus"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ProjectInvoiceStatus_markedByEmployeeId_idx" ON "ProjectInvoiceStatus"("markedByEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvoiceStatus_companyId_projectId_startDate_endDate_key" ON "ProjectInvoiceStatus"("companyId", "projectId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "ProjectInvoiceStatus" ADD CONSTRAINT "ProjectInvoiceStatus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoiceStatus" ADD CONSTRAINT "ProjectInvoiceStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoiceStatus" ADD CONSTRAINT "ProjectInvoiceStatus_markedByEmployeeId_fkey" FOREIGN KEY ("markedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
