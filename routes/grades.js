import express from 'express';
import Grade from '../models/Grade.js';
import { Types } from 'mongoose';

const router = express.Router();

// GET a single grade entry by ID
router.get('/:id', async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).send("Not Found");
    res.status(200).json(grade);
  } catch (err) {
    next(err);
  }
});

// Redirect for backwards compatibility (student -> learner)
router.get("/student/:id", (req, res) => {
  res.redirect(`../learner/${req.params.id}`);
});

// GET a student's grade data
router.get('/learner/:id', async (req, res, next) => {
  try {
    const query = { learner_id: Number(req.params.id) };
    if (req.query.class) query.class_id = Number(req.query.class);

    const grades = await Grade.find(query);
    if (!grades.length) return res.status(404).send("Not Found");
    res.status(200).json(grades);
  } catch (err) {
    next(err);
  }
});

// GET a class's grade data
router.get('/class/:id', async (req, res, next) => {
  try {
    const query = { class_id: Number(req.params.id) };
    if (req.query.learner) query.learner_id = Number(req.query.learner);

    const grades = await Grade.find(query);
    if (!grades.length) return res.status(404).send("Not Found");
    res.status(200).json(grades);
  } catch (err) {
    next(err);
  }
});

// GET learner's average score for EACH class
router.get("/learner/:id/class/average", async (req, res, next) => {
  try {
    const learnerGrades = await Grade.find({ learner_id: Number(req.params.id) });
    const averages = learnerGrades.reduce((acc, grade) => {
      const totalScore = grade.scores.reduce((sum, score) => sum + score.score, 0);
      acc[grade.class_id] = totalScore / grade.scores.length;
      return acc;
    }, {});
    res.status(200).json(averages);
  } catch (err) {
    next(err);
  }
});

// GET overall average score for a learner
router.get("/learner/:id/average", async (req, res, next) => {
  try {
    const learnerGrades = await Grade.find({ learner_id: Number(req.params.id) });
    const { totalScore, count } = learnerGrades.reduce((acc, grade) => {
      grade.scores.forEach(score => {
        acc.totalScore += score.score;
        acc.count++;
      });
      return acc;
    }, { totalScore: 0, count: 0 });
    const overallScore = totalScore / count;
    res.status(200).send(`Overall average: ${overallScore}`);
  } catch (err) {
    next(err);
  }
});

// CREATE a single grade entry
router.post('/', async (req, res, next) => {
  try {
    const newGrade = new Grade(req.body);
    const result = await newGrade.save();
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// ADD a score to a grade entry
router.patch('/:id/add', async (req, res, next) => {
  try {
    const result = await Grade.findByIdAndUpdate(
      req.params.id,
      { $push: { scores: req.body } },
      { new: true }
    );
    if (!result) return res.status(404).send("Not Found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// REMOVE a score from a grade entry
router.patch('/:id/remove', async (req, res, next) => {
  try {
    const result = await Grade.findByIdAndUpdate(
      req.params.id,
      { $pull: { scores: req.body } },
      { new: true }
    );
    if (!result) return res.status(404).send("Not Found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// UPDATE class_id for all entries in a class
router.patch("/class/:id", async (req, res, next) => {
  try {
    const result = await Grade.updateMany(
      { class_id: Number(req.params.id) },
      { $set: { class_id: req.body.class_id } }
    );
    if (!result.matchedCount) return res.status(404).send("Not found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE a single grade entry by ID
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await Grade.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).send("Not Found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE a learner's grade entries
router.delete("/learner/:id", async (req, res, next) => {
  try {
    const result = await Grade.deleteMany({ learner_id: Number(req.params.id) });
    if (!result.deletedCount) return res.status(404).send("Not Found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE a class's grade entries
router.delete("/class/:id", async (req, res, next) => {
  try {
    const result = await Grade.deleteMany({ class_id: Number(req.params.id) });
    if (!result.deletedCount) return res.status(404).send("Not Found");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
