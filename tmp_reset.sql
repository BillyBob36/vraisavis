UPDATE fingerprints SET "lastPlayedAt" = NULL, "lastServiceType" = NULL WHERE "restaurantId" IN (SELECT id FROM restaurants WHERE name = 'Chez Bibi');
