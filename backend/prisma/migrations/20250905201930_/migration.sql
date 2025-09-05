/*
  Warnings:

  - You are about to drop the `WaitingList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WaitingList" DROP CONSTRAINT "WaitingList_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "invitedBy" INTEGER;

-- DropTable
DROP TABLE "public"."WaitingList";

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
