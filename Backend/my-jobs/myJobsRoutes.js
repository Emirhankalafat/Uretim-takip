const express = require('express');
const router = express.Router();
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  getMyJobs,
  getMyJobDetail,
  startMyJob,
  completeMyJob,
  updateMyJobNotes
} = require('./myJobsController');

// Kendi işlerini listeleme - MY_JOBS yetkisi gerekli
router.get('/', requirePermission('MY_JOBS'), getMyJobs);

// Belirli işin detayını getirme - MY_JOBS yetkisi gerekli
router.get('/:stepId', requirePermission('MY_JOBS'), getMyJobDetail);

// İşi başlatma - MY_JOBS yetkisi gerekli
router.post('/:stepId/start', requirePermission('MY_JOBS'), startMyJob);

// İşi tamamlama - MY_JOBS yetkisi gerekli
router.post('/:stepId/complete', requirePermission('MY_JOBS'), completeMyJob);

// İş notlarını güncelleme - MY_JOBS yetkisi gerekli
router.put('/:stepId/notes', requirePermission('MY_JOBS'), updateMyJobNotes);

module.exports = router; 