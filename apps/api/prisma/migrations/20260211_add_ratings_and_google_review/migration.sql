-- AlterTable: Add positiveRating and negativeRating to feedbacks
ALTER TABLE "feedbacks" ADD COLUMN "positive_rating" INTEGER;
ALTER TABLE "feedbacks" ADD COLUMN "negative_rating" INTEGER;

-- AlterTable: Add googleReviewUrl to restaurants
ALTER TABLE "restaurants" ADD COLUMN "google_review_url" TEXT;
