import express from 'express'
import { addCategory, deleteCategory, getCategory, getCategoryProductsStats, getProductsByCategory, getProductsByCategoryWithFilters, updateCategory } from '../../Controller/AdminController/categoryController'
import authenticate from '../../Middleware/authMiddleware'

const router = express.Router()

router.post("/addcategory",authenticate,addCategory)
router.get("/getcategory",getCategory)
router.delete("/deletecategory",authenticate,deleteCategory)
router.put("/updatecategory",authenticate,updateCategory)

// Get products by category name
router.get('/category/:categoryName/products', getProductsByCategory);

// Get products by category with filters
router.get('/category/:categoryName/products/filtered', getProductsByCategoryWithFilters);

// Get category statistics
router.get('/category/:categoryName/stats', getCategoryProductsStats);



export default router
