const express = require('express')
const router = express.Router()
const homeController = require('../controllers/home')

router.get('/diseas',homeController.getDiseas)
router.get('/news',homeController.getHealthNews)
router.get('/userType/:id',homeController.determineUserType)

module.exports = router