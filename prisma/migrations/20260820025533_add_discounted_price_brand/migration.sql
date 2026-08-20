/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletTxType" ADD VALUE 'COIN_GIFT';
ALTER TYPE "WalletTxType" ADD VALUE 'COIN_SPEND';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "newValues" JSONB,
ADD COLUMN     "oldValues" JSONB;

-- AlterTable
ALTER TABLE "FarmerProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allowInstallment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowRetail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "certificate" TEXT,
ADD COLUMN     "compareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "countryOfOrigin" TEXT,
ADD COLUMN     "discountedPrice" DECIMAL(12,2),
ADD COLUMN     "instructionPdf" TEXT,
ADD COLUMN     "instructionPdfUrl" TEXT,
ADD COLUMN     "isOrganic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labelPdf" TEXT,
ADD COLUMN     "labelPdfUrl" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "maxApplications" INTEGER,
ADD COLUMN     "mixingCompatibility" TEXT,
ADD COLUMN     "packaging" TEXT,
ADD COLUMN     "phoneViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preparativeForm" TEXT,
ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "safetyInfo" TEXT,
ADD COLUMN     "storageInfo" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'ədəd',
ADD COLUMN     "useNorm" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "waitingPeriod" INTEGER,
ADD COLUMN     "waterVolume" TEXT,
ADD COLUMN     "wholesaleMinQty" INTEGER,
ADD COLUMN     "wholesalePrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "installmentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "installmentWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "StoreSubscription" ADD COLUMN     "planId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "onTimeDeliveryRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "coins" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "country" TEXT,
    "website" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxListings" INTEGER NOT NULL DEFAULT 10,
    "freeVipListings" INTEGER NOT NULL DEFAULT 0,
    "customSubdomain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicBlock" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL DEFAULT 'home',
    "type" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgroServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "farmLocation" TEXT,
    "cropType" TEXT,
    "area" TEXT,
    "notes" TEXT,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "resultFileUrl" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgroServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageLayout" (
    "id" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT 'green',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemText" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueAz" TEXT NOT NULL,
    "valueEn" TEXT,
    "valueRu" TEXT,
    "module" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TieredPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tierType" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "regionCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TieredPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgroRule" (
    "id" TEXT NOT NULL,
    "triggerDiseaseId" TEXT,
    "triggerPestId" TEXT,
    "condition" TEXT,
    "recommendedProductIds" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AIAgroRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSettings" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gpt-4',
    "systemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClimateWarning" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "warningType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isSmsSent" BOOLEAN NOT NULL DEFAULT false,
    "isPushSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClimateWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLevel" (
    "id" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perks" TEXT[],

    CONSTRAINT "LoyaltyLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsTariff" (
    "id" TEXT NOT NULL,
    "fromRegion" TEXT NOT NULL,
    "toRegion" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "pricePerKg" DECIMAL(10,2) NOT NULL,
    "estimatedDays" INTEGER NOT NULL,

    CONSTRAINT "LogisticsTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "disputeReason" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingEmail" (
    "id" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "replyBody" TEXT,
    "replySubject" TEXT,
    "replySentAt" TIMESTAMP(3),
    "attachments" JSONB,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "DynamicBlock_page_isActive_idx" ON "DynamicBlock"("page", "isActive");

-- CreateIndex
CREATE INDEX "DynamicBlock_sortOrder_idx" ON "DynamicBlock"("sortOrder");

-- CreateIndex
CREATE INDEX "AgroServiceRequest_userId_idx" ON "AgroServiceRequest"("userId");

-- CreateIndex
CREATE INDEX "AgroServiceRequest_serviceType_idx" ON "AgroServiceRequest"("serviceType");

-- CreateIndex
CREATE INDEX "AgroServiceRequest_status_idx" ON "AgroServiceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PageLayout_pageName_key" ON "PageLayout"("pageName");

-- CreateIndex
CREATE UNIQUE INDEX "SystemText_key_key" ON "SystemText"("key");

-- CreateIndex
CREATE INDEX "TieredPrice_productId_tierType_idx" ON "TieredPrice"("productId", "tierType");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyLevel_levelName_key" ON "LoyaltyLevel"("levelName");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_orderId_key" ON "EscrowTransaction"("orderId");

-- CreateIndex
CREATE INDEX "IncomingEmail_toEmail_idx" ON "IncomingEmail"("toEmail");

-- CreateIndex
CREATE INDEX "IncomingEmail_isRead_idx" ON "IncomingEmail"("isRead");

-- CreateIndex
CREATE INDEX "IncomingEmail_receivedAt_idx" ON "IncomingEmail"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_status_categoryId_createdAt_idx" ON "Product"("status", "categoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProductActiveIngredient_productId_idx" ON "ProductActiveIngredient"("productId");

-- CreateIndex
CREATE INDEX "ProductActiveIngredient_activeIngredientId_idx" ON "ProductActiveIngredient"("activeIngredientId");

-- CreateIndex
CREATE INDEX "ProductCrop_productId_idx" ON "ProductCrop"("productId");

-- CreateIndex
CREATE INDEX "ProductCrop_cropId_idx" ON "ProductCrop"("cropId");

-- CreateIndex
CREATE INDEX "ProductDisease_productId_idx" ON "ProductDisease"("productId");

-- CreateIndex
CREATE INDEX "ProductDisease_diseaseId_idx" ON "ProductDisease"("diseaseId");

-- CreateIndex
CREATE INDEX "ProductPest_productId_idx" ON "ProductPest"("productId");

-- CreateIndex
CREATE INDEX "ProductPest_pestId_idx" ON "ProductPest"("pestId");

-- CreateIndex
CREATE INDEX "Review_isApproved_productId_idx" ON "Review"("isApproved", "productId");

-- CreateIndex
CREATE INDEX "SalesPoint_storeId_idx" ON "SalesPoint"("storeId");

-- CreateIndex
CREATE INDEX "StoreSubscription_planId_idx" ON "StoreSubscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgroServiceRequest" ADD CONSTRAINT "AgroServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TieredPrice" ADD CONSTRAINT "TieredPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
