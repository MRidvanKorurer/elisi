const express = require('express');
const router = express.Router();
const { getProductReviews, getReviewEligibility, createReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewPhotos } = require('../middleware/uploadMiddleware');

router.get('/:id/eligibility', protect, getReviewEligibility);
router.delete('/item/:reviewId', protect, deleteReview);
router.get('/:id', getProductReviews);
router.post('/:id', protect, reviewPhotos, createReview);

module.exports = router;
