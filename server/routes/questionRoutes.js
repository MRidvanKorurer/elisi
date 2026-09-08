const express = require('express');
const router = express.Router();
const {
  getProductQuestions,
  askQuestion,
  getSellerQuestions,
  answerQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const { protect, optionalProtect, approvedSeller } = require('../middleware/authMiddleware');

router.get('/seller/inbox', protect, approvedSeller, getSellerQuestions);
router.put('/item/:questionId/answer', protect, answerQuestion);
router.delete('/item/:questionId', protect, deleteQuestion);
router.get('/:id', optionalProtect, getProductQuestions);
router.post('/:id', protect, askQuestion);

module.exports = router;
