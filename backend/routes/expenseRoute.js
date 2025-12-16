import express from 'express';
import { Protect } from '../middlewares/Authentication.js';
import { createExpense, getAllExpenses, deleteExpense, getExpensesSummary } from '../controllers/expenseController.js';

const router = express.Router();

router.post('/addExpense', Protect, createExpense);
router.get('/getAllExpenses', Protect, getAllExpenses);
router.delete('/delete/:id', Protect, deleteExpense);
router.get('/summary', Protect, getExpensesSummary);

export default router;
