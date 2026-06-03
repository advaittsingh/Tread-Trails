-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('requested', 'confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "images" TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "specs" JSONB NOT NULL DEFAULT '[]',
    "variants" JSONB NOT NULL DEFAULT '[]',
    "compatibleCars" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'stripe',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "vehicleSlug" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageHit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '/',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "ipHash" TEXT NOT NULL DEFAULT '',
    "city" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "geoResolved" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartTelemetry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lines" JSONB NOT NULL DEFAULT '[]',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "subtotalHint" INTEGER NOT NULL DEFAULT 0,
    "userEmail" TEXT,
    "lastPath" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppErrorLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "PageHit_sessionId_idx" ON "PageHit"("sessionId");

-- CreateIndex
CREATE INDEX "PageHit_createdAt_idx" ON "PageHit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceSession_sessionId_key" ON "PresenceSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartTelemetry_sessionId_key" ON "CartTelemetry"("sessionId");

-- CreateIndex
CREATE INDEX "CartTelemetry_updatedAt_idx" ON "CartTelemetry"("updatedAt");

-- CreateIndex
CREATE INDEX "AppErrorLog_createdAt_idx" ON "AppErrorLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
