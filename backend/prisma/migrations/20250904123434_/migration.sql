-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isInvited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InviteCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaitingList" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "public"."InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_userId_key" ON "public"."InviteCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_email_key" ON "public"."WaitingList"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_userId_key" ON "public"."WaitingList"("userId");

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaitingList" ADD CONSTRAINT "WaitingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
