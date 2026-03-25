import express from 'express';
import { Protect, requireRoles } from '../middlewares/Authentication.js';
import { createExpense, getAllExpenses, deleteExpense, getExpensesSummary } from '../controllers/expenseController.js';

const router = express.Router();

router.post('/addExpense', Protect, requireRoles("admin"), createExpense);
router.get('/getAllExpenses', Protect, requireRoles("admin"), getAllExpenses);
router.delete('/delete/:id', Protect, requireRoles("admin"), deleteExpense);
router.get('/summary', Protect, requireRoles("admin"), getExpensesSummary);

export default router;
