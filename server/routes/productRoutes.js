const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, recordProductView, getBestSellers, getSponsoredProducts, getCategoryHighlights, getFilteredProducts, getCategories, getFilterOptions } = require('../controllers/productController');

router.get('/sponsored', getSponsoredProducts);
router.get('/bestsellers', getBestSellers);
router.get('/category-highlights', getCategoryHighlights);
router.get('/', getAllProducts);
router.get('/filter', getFilteredProducts);
router.get('/filter-options', getFilterOptions);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/:id/view', recordProductView);

module.exports = router;
