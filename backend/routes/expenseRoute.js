import express from 'express';
import { Protect, requireRoles } from '../middlewares/Authentication.js';
import { createExpense, getAllExpenses, deleteExpense, getExpensesSummary } from '../controllers/expenseController.js';

const router = express.Router();

router.post('/addExpense', Protect, requireRoles("manager"), createExpense);
router.get('/getAllExpenses', Protect, requireRoles("manager"), getAllExpenses);
router.delete('/delete/:id', Protect, requireRoles("manager"), deleteExpense);
router.get('/summary', Protect, requireRoles("manager"), getExpensesSummary);

export default router;
