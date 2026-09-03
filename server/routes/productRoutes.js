const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, getProductById, getBestSellers, getSponsoredProducts, getFilteredProducts,getCategories } = require('../controllers/productController');

// POST: /api/products 
router.get('/sponsored', getSponsoredProducts);

router.get('/bestsellers', getBestSellers);

// GET: /api/products 
router.get('/', getAllProducts);
router.get('/filter', getFilteredProducts);
router.get('/categories', getCategories);

router.get('/:id', getProductById);

// POST: /api/products 
router.post('/', createProduct);



module.exports = router;