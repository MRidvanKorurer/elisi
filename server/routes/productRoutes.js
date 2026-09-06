const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, getBestSellers, getSponsoredProducts, getFilteredProducts, getCategories, getFilterOptions, getLookbook } = require('../controllers/productController');

// POST: /api/products 
router.get('/sponsored', getSponsoredProducts);

router.get('/bestsellers', getBestSellers);

router.get('/lookbook', getLookbook);

// GET: /api/products 
router.get('/', getAllProducts);
router.get('/filter', getFilteredProducts);
router.get('/filter-options', getFilterOptions);
router.get('/categories', getCategories);

router.get('/:id', getProductById);

module.exports = router;