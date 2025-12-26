import express from 'express';
import {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  resolveComplaint,
  addComplaintNote,
  getComplaintStats,
  getComplaintAnalytics,
  deleteComplaint,
  exportComplaints,
} from '../../Controller/AdminController/complaintController';
import  authenticateAdmin  from '../../Middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all complaints with filters
router.get('/', getAllComplaints);

// Get complaint statistics
router.get('/stats', getComplaintStats);

// Get complaint analytics
router.get('/analytics', getComplaintAnalytics);

// Export complaints
router.get('/export', exportComplaints);

// Get specific complaint
router.get('/:id', getComplaintById);

// Create new complaint
router.post('/createcomplaint', createComplaint);

// Update complaint
router.put('/:id', updateComplaint);

// Resolve complaint
router.post('/:id/resolve', resolveComplaint);

// Add note to complaint
router.post('/:id/notes', addComplaintNote);

// Delete complaint
router.delete('/:id', deleteComplaint);

export default router;