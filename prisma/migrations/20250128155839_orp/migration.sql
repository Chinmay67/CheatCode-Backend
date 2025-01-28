-- CreateTable
CREATE TABLE "otp_verify" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "otp" INTEGER NOT NULL,

    CONSTRAINT "otp_verify_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "otp_verify_email_key" ON "otp_verify"("email");

-- CreateIndex
CREATE UNIQUE INDEX "otp_verify_otp_key" ON "otp_verify"("otp");
