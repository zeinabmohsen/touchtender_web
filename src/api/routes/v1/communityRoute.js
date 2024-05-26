const express = require("express");
const router = express.Router();
const { 
    createComment, 
    deleteComment, 
    updateComment, 
    addReply, 
    addLike, 
    unlikeComment, 
    getTotalLikes,
    getCommentById, 
    getRepliesByCommentId,
    getAllComments,
    getCommentsByUserId,
    runChat,
    getTotalLikesForUser
} = require("../../controllers/communityController");

// Routes for CRUD operations
router.post("/addcomment", createComment);
router.delete("/deletecomment/:commentID", deleteComment);
router.put("/updatecomment/:commentID", updateComment);

// Additional routes for replies and likes
router.post("/addreply/:commentID", addReply);
router.post("/addlike/:commentID", addLike);
router.delete("/unlike/:commentID", unlikeComment);
router.get("/totallikes/:commentID", getTotalLikes);

// Routes for retrieving comment details and replies
router.get("/comment/:commentID", getCommentById); // Route to get comment by ID
router.get("/comment/:commentID/replies", getRepliesByCommentId); // Route to get replies by comment ID

// Routes for retrieving all comments and comments by user ID
router.get("/comments", getAllComments); // Route to get all comments
router.get("/comments/user/:userID", getCommentsByUserId); // Route to get comments by user ID


router.post('/chat', async (req, res) => {
    try {
      const userInput = req.body.userInput;
      console.log('Received user input:', userInput);
  
      if (!userInput) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
  
      const response = await runChat(userInput);
      res.json({ response });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      if (error.message) {
        return res.status(500).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
  
  router.get("/totaluserlikes/:userID", getTotalLikesForUser)


module.exports = router;


