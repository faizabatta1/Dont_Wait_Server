const express = require('express')
const router = express.Router();
const centreController = require('../controllers/centre')


router.post('/centres',centreController.addNewCentre)
router.get('/centres',centreController.getCentres)
router.post('/centres/auth/login',centreController.loginCentre)
router.post('/centres/reservations',centreController.reserveNewAppointment)
router.put('/centres/reservations',centreController.updateAppointment)
router.delete('/centres/reservations',centreController.deleteAppointment)
router.get('/users/:id/reservations',centreController.getAllUserAppointments)
router.get('/centres/:id/reservations',centreController.getAllCentreAppointments)
router.get('/centres/:id',centreController.getCentre)
router.post('/centres/reservations/:id/status/update',centreController.updateAppointmentStatus)
router.post('/centres/reports',centreController.pushTestReport)
router.post('/centres/feedbacks',centreController.pushFeedback)
router.get('/centres/:id/feedbacks',centreController.getFeedbacks)
module.exports = router