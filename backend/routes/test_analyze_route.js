import express from 'express';
import mongoose from 'mongoose';
import TestResponse from '../models/test_analyze.js';

const router = express.Router();

// Create a new TestResponse
router.post('/test_responses', async (req, res) => {
  try {
    const { userId, testId, responses } = req.body;

    if (!userId || !testId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ message: 'Invalid input data.' });
    }

    const testResponse = new TestResponse({
      userId,
      testId,
      responses,
    });

    await testResponse.save();
    res.status(201).json(testResponse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create test response.', error: error.message });
  }
});

// Get all TestResponses

router.get('/test-responses', async (req, res) => {
  try {
    const testResponses = await TestResponse.find()
      .populate('userId', 'name email') // Populate user info
      .populate('testId', 'name description') // Populate test info
      .populate('responses.questionId', 'text options'); // Populate question info

    res.status(200).json(testResponses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch test responses.', error: error.message });
  }
});

// Get a single TestResponse by ID
router.get('/test-responses/:testID/:userID', async (req, res) => {
  try {
    const { testID, userID } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(testID) || !mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({ message: 'Invalid testID or userID.' });
    }

    // Find the test response
    const testResponse = await TestResponse.findOne({ testId: testID, userId: userID })
      .populate('userId', 'name email') // Populate user details
      .populate('testId', 'name description') // Populate test details
      .populate({
        path: 'responses.questionId', // Populate questionId in responses
        select: 'questionText subject options correctAnswer type' // Select fields for Question
      })
      .populate({
        path: 'responses.correctAnswer', // Populate the correctAnswer (which may be a reference to a Question or another field)
        select: 'answerText', // Specify which fields to select for correctAnswer (assuming it’s another model)
      })
      .select('responses') // Ensure the responses array is included
      .lean(); // Optional: Converts the result to a plain JavaScript object, better for read operations.

    // Check if the test response exists
    if (!testResponse) {
      return res.status(404).json({ message: 'Test response not found.' });
    }

    // Respond with the fully populated test response
    res.status(200).json(testResponse);
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      message: 'Failed to fetch test response.',
      error: error.message,
    });
  }
});



// Update a TestResponse by ID
router.put('/test-responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID.' });
    }

    const testResponse = await TestResponse.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!testResponse) {
      return res.status(404).json({ message: 'Test response not found.' });
    }

    res.status(200).json(testResponse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update test response.', error: error.message });
  }
});

// Delete a TestResponse by ID
router.delete('/test-responses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID.' });
    }

    const testResponse = await TestResponse.findByIdAndDelete(id);

    if (!testResponse) {
      return res.status(404).json({ message: 'Test response not found.' });
    }

    res.status(200).json({ message: 'Test response deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete test response.', error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    
    const { userId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message:`${userId} not valid` });
    }

    // Find all test responses by user ID and return only test IDs
    const attemptedTests = await TestResponse.find({ userId }).select("testId");

    if (!attemptedTests.length) {
      return res.status(404).json({ message: "No attempted tests found." });
    }

    // Extract test IDs from the response
    const testIds = attemptedTests.map((test) => test.testId);

    res.status(200).json({ attemptedTests: testIds });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attempted tests.", error: error.message });
  }
});




export default router;
