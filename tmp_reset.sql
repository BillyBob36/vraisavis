UPDATE fingerprints SET "lastPlayedAt" = NULL, "lastServiceType" = NULL WHERE id IN (SELECT id FROM fingerprints ORDER BY "createdAt" DESC LIMIT 5);
