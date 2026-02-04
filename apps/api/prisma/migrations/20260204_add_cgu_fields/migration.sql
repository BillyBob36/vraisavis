-- Ajout des champs d'acceptation CGU/CGV sur les restaurants
ALTER TABLE "restaurants" ADD COLUMN "cgu_accepted_at" TIMESTAMP(3);
ALTER TABLE "restaurants" ADD COLUMN "cgu_accepted_ip" TEXT;
ALTER TABLE "restaurants" ADD COLUMN "cgu_version" TEXT;
