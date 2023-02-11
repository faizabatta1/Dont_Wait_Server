const express = require('express')
const router = express.Router()
const verifyController = require('../controllers/verify')

router.get('/send',verifyController.sendVerifyCode)
router.post('/codes',verifyController.createVerificationCode)
router.post('/compare',verifyController.compareCodes)
router.post('/reset',verifyController.resetPassword) 
// router.get('/test',verifyController.test)


module.exports = router