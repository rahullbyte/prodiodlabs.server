const express = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');

const router = express.Router();

// Get user's board with populated lists and tasks
router.get('/', async (req, res) => {
  try {
    const board = await Board.findOne({ userId: req.user.id }).populate({
      path: 'lists',
      populate: { path: 'tasks' },
    });
    if (!board) {
      const newBoard = new Board({ userId: req.user.id });
      await newBoard.save();
      return res.json(newBoard);
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching board', error });
  }
});

// Create a new list
router.post('/list', async (req, res) => {
  try {
    const { title } = req.body;
    const board = await Board.findOne({ userId: req.user.id });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    const list = new List({ title, boardId: board._id });
    await list.save();
    board.lists.push(list._id);
    await board.save();
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error creating list', error });
  }
});

// Delete a list
router.delete('/list/:id', async (req, res) => {
  try {
    const listId = req.params.id;
    const board = await Board.findOne({ userId: req.user.id });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Remove list from board
    board.lists = board.lists.filter((id) => id.toString() !== listId);
    await board.save();

    // Delete list and its tasks
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: 'List not found' });
    await Task.deleteMany({ listId });
    await List.findByIdAndDelete(listId);

    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting list', error });
  }
});

// Create a new task
router.post('/task', async (req, res) => {
  try {
    const { title, description, dueDate, priority, listId } = req.body;
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: 'List not found' });

    const task = new Task({ title, description, dueDate, priority, listId });
    await task.save();
    list.tasks.push(task._id);
    await list.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
});

// Update a task (full update)
// Update task's listId on drag-and-drop
router.put('/task/:id', async (req, res) => {
  try {
    const { listId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (listId && listId !== task.listId.toString()) {
      // Remove from old list
      const oldList = await List.findById(task.listId);
      if (oldList) {
        oldList.tasks = oldList.tasks.filter((id) => id.toString() !== task._id.toString());
        await oldList.save();
      }

      // Add to new list
      const newList = await List.findById(listId);
      if (newList) {
        newList.tasks.push(task._id);
        await newList.save();
      }

      // Update task
      task.listId = listId;
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});


// Delete a task
router.delete('/task/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const list = await List.findById(task.listId);
    list.tasks = list.tasks.filter((id) => id.toString() !== task._id.toString());
    await list.save();

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
});

module.exports = router;