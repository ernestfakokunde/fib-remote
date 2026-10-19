import Expense from '../models/expenseModel.js';
import Category from '../models/categoryModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';
import { notifyExpenseRecorded } from '../services/notificationService.js';
import { isValidMoney, roundMoney } from '../utils/money.js';
import { buildDateRange } from '../utils/dateRange.js';

// Create a new expense
export const createExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    const userId = req.workspaceOwnerId;

    if (amount === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Amount and category are required' });
    }
    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: 'Expense category ID is invalid' });
    }

    const parsedAmount = Number(amount);
    if (!isValidMoney(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a finite amount greater than 0' });
    }
    const roundedAmount = roundMoney(parsedAmount);
    if (roundedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 0.01' });
    }
    const expenseDate = date ? new Date(date) : new Date();
    if (!Number.isFinite(expenseDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Expense date is invalid' });
    }

    // Ensure category exists and belongs to the user
    const cat = await Category.findOne({ _id: category, createdBy: userId });
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const expense = new Expense({
      amount: roundedAmount,
      description: description?.trim() || '',
      category,
      date: expenseDate,
      createdBy: userId,
    });

    const saved = await expense.save();
    res.status(201).json({ success: true, expense: saved, message: 'Expense recorded' });

    // Notify user
    void User.findById(userId)
      .then((user) => user && notifyExpenseRecorded(user, saved, cat))
      .catch((error) => console.error('Expense notification failed:', error.message));
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get paginated expenses with filters
export const getAllExpenses = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { filter, start, end, category } = req.query;
    let dateQuery = {};
    const now = new Date();

    if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      dateQuery = { $gte: startOfDay, $lte: now };
    }
    if (filter === 'last7days') {
      const last7 = new Date(); last7.setDate(now.getDate() - 7);
      dateQuery = { $gte: last7, $lte: now };
    }
    if (start || end) {
      const { range, error } = buildDateRange(start, end);
      if (error) return res.status(400).json({ success: false, message: error });
      dateQuery = range;
    }

    const query = { createdBy: userId, ...(Object.keys(dateQuery).length && { date: dateQuery }) };
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('category', 'name color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    res.json({ success: true, currentPage: page, totalPages: Math.ceil(total / limit), total, expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete an expense
export const deleteExpense = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Expense ID is invalid' });
    const deleted = await Expense.findOneAndDelete({ _id: id, createdBy: userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Summary endpoint: total expenses, transactions, categories count, average
export const getExpensesSummary = async (req, res) => {
  try {
    const userId = req.workspaceOwnerId;
    // Optional date filtering (to align with reports page filters)
    const { filter, start, end, category } = req.query;
    const now = new Date();
    let dateQuery = {};

    if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateQuery = { $gte: startOfDay, $lte: now };
    }

    if (filter === 'last7days') {
      const last7 = new Date();
      last7.setDate(now.getDate() - 7);
      dateQuery = { $gte: last7, $lte: now };
    }

    if (start || end) {
      const { range, error } = buildDateRange(start, end);
      if (error) return res.status(400).json({ success: false, message: error });
      dateQuery = range;
    }

    const match = {
      createdBy: userId,
      ...(Object.keys(dateQuery).length && { date: dateQuery }),
      ...(category && { category }),
    };

    // total amount and count in the (optionally) filtered window
    const agg = await Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } }
    ]);
    const [categoriesCount, byCategory] = await Promise.all([
      Expense.distinct('category', match).then((result) => result.length),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $set: { total: { $round: ['$total', 2] } } },
        { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, categoryId: '$_id', name: { $ifNull: ['$category.name', 'Uncategorized'] }, color: '$category.color', total: 1, count: 1 } },
        { $sort: { total: -1 } },
      ]),
    ]);
    const row = agg[0] || { total: 0, count: 0, avg: 0 };
    res.json({ success: true, totalExpenses: roundMoney(row.total || 0), totalTransactions: row.count || 0, averageExpense: roundMoney(row.avg || 0), categories: categoriesCount, byCategory });
  } catch (error) {
    console.error('Expenses summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
