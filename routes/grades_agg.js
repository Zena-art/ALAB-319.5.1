import express from "express";
import Grade from "../models/Grades.js";

const router = express.Router();

/**
 * Grading Weights by Score Type:
 * - Exams: 50%
 * - Quizzes: 30%
 * - Homework: 20%
 */

// Get the weighted average of a specified learner's grades, per class
router.get("/learner/:id/avg-class", async (req, res) => {
  try {
    const result = await Grade.aggregate([
      { $match: { learner_id: Number(req.params.id) } },
      { $unwind: "$scores" },
      {
        $group: {
          _id: "$class_id",
          quiz: { $push: { $cond: [{ $eq: ["$scores.type", "quiz"] }, "$scores.score", "$$REMOVE"] } },
          exam: { $push: { $cond: [{ $eq: ["$scores.type", "exam"] }, "$scores.score", "$$REMOVE"] } },
          homework: { $push: { $cond: [{ $eq: ["$scores.type", "homework"] }, "$scores.score", "$$REMOVE"] } },
        },
      },
      {
        $project: {
          _id: 0,
          class_id: "$_id",
          avg: {
            $sum: [
              { $multiply: [{ $avg: "$exam" }, 0.5] },
              { $multiply: [{ $avg: "$quiz" }, 0.3] },
              { $multiply: [{ $avg: "$homework" }, 0.2] },
            ],
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      res.status(404).send("Not found");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error during aggregation:", error);
    res.status(500).send("Internal server error");
  }
});

// Statistics route: Count learners with a weighted average above 50%
router.get("/stats/count", async (req, res) => {
  try {
    const result = await Grade.aggregate([
      { $unwind: "$scores" },
      { $group: { _id: "$learner_id", avg: { $avg: "$scores.score" } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          above: { $sum: { $cond: [{ $gte: ["$avg", 50] }, 1, 0] } }
        }
      },
      {
        $project: {
          count: 1,
          above: 1,
          percent: {
            $cond: {
              if: { $gt: ["$count", 0] },
              then: { $multiply: [{ $divide: ["$above", "$count"] }, 100] },
              else: 0
            }
          }
        }
      }
    ]);

    if (!result || result.length === 0) {
      res.status(404).send("Not found");
    } else {
      res.status(200).json(result[0]);
    }
  } catch (error) {
    console.error("Error during aggregation:", error);
    res.status(500).send("Internal server error");
  }
});

// Statistics route by class ID
router.get("/stats/:id", async (req, res) => {
  try {
    const result = await Grade.aggregate([
      { $match: { class_id: Number(req.params.id) } },
      { $unwind: "$scores" },
      { $group: { _id: "$learner_id", avg: { $avg: "$scores.score" } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          above: { $sum: { $cond: [{ $gte: ["$avg", 50] }, 1, 0] } }
        }
      },
      {
        $project: {
          count: 1,
          above: 1,
          percent: {
            $cond: {
              if: { $gt: ["$count", 0] },
              then: { $multiply: [{ $divide: ["$above", "$count"] }, 100] },
              else: 0
            }
          }
        }
      }
    ]);

    if (!result || result.length === 0) {
      res.status(404).send("Not found");
    } else {
      res.status(200).json(result[0]);
    }
  } catch (error) {
    console.error("Error during aggregation:", error);
    res.status(500).send("Internal server error");
  }
});

export default router;
