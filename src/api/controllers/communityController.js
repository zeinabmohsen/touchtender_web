const connection = require("../../config/database");

exports.createComment = async (req, res) => {
    try {
        const { userID, content, category } = req.body;

        // Validate user input
        if (!userID || !content || !category) {
            return res.status(400).json({ error: 'userID, content, and category are required fields.' });
        }

        // Additional validation for userID, content, and category if needed

        connection.query('INSERT INTO Comments (UserID, Content, category) VALUES (?, ?, ?)', [userID, content, category], (error, results, fields) => {
            if (error) {
                console.error('Error inserting comment: ' + error);
                return res.status(500).json({ error: 'An error occurred while creating the comment.' });
            }

            console.log('New comment added successfully.');

            const commentId = results.insertId; // Assuming your database returns the ID of the newly inserted comment

            // Construct the comment object to send in the response
            const newComment = {
                id: commentId,
                userID: userID,
                content: content,
                category: category
            };

            return res.status(201).json({ message: 'Comment created successfully.', comment: newComment });
        });
    } catch (error) {
        console.error('Error creating comment: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { commentID } = req.params;
        const { content, category } = req.body;

        // Validate user input
        if (!commentID || !content || !category) {
            return res.status(400).json({ error: 'commentID, content, and category are required fields.' });
        }

        // Additional validation for commentID, content, and category if needed

        connection.query('UPDATE Comments SET Content = ?, category = ? WHERE CommentID = ?', [content, category, commentID], (error, results, fields) => {
            if (error) {
                console.error('Error updating comment: ' + error);
                return res.status(500).json({ error: 'An error occurred while updating the comment.' });
            }

            if (results.affectedRows === 0) {
                console.error('Comment with ID ' + commentID + ' not found.');
                return res.status(404).json({ error: 'Comment not found.' });
            }

            console.log('Comment updated successfully.');
            return res.status(200).json({ message: 'Comment updated successfully.' });
        });
    } catch (error) {
        console.error('Error updating comment: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Function to get a comment by its ID
exports.getCommentById = async (req, res) => {
    try {
        const { commentID } = req.params;

        // Validate user input
        if (!commentID) {
            return res.status(400).json({ error: 'commentID is a required field.' });
        }

        // Additional validation for commentID if needed

        // Query to get the comment details by its ID
        connection.query('SELECT * FROM Comments WHERE CommentID = ?', [commentID], (error, commentResults, fields) => {
            if (error) {
                console.error('Error fetching comment: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching the comment.' });
            }

            // Check if the comment exists
            if (commentResults.length === 0) {
                console.error('Comment with ID ' + commentID + ' not found.');
                return res.status(404).json({ error: 'Comment not found.' });
            }

            const comment = commentResults[0]; // Extract the first comment from the results
            console.log('Comment fetched successfully:', comment);
            return res.status(200).json({ comment });
        });
    } catch (error) {
        console.error('Error getting comment by ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

// Function to get replies by comment ID
exports.getRepliesByCommentId = async (req, res) => {
    try {
        const { commentID } = req.params;

        // Validate user input
        if (!commentID) {
            return res.status(400).json({ error: 'commentID is a required field.' });
        }

        // Additional validation for commentID if needed

        // Query to get replies associated with the comment ID
        connection.query('SELECT * FROM Replies WHERE CommentID = ?', [commentID], (error, replyResults, fields) => {
            if (error) {
                console.error('Error fetching replies: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching the replies.' });
            }

            console.log('Replies fetched successfully:', replyResults);
            return res.status(200).json({ replies: replyResults });
        });
    } catch (error) {
        console.error('Error getting replies by comment ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

exports.getAllComments = async (req, res) => {
    try {
        // Query to fetch all comments from the database
        connection.query('SELECT * FROM Comments', (error, results, fields) => {
            if (error) {
                console.error('Error retrieving comments: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching comments.' });
            }

            console.log('Comments retrieved successfully.');

            // Send the retrieved comments as response
            return res.status(200).json({ comments: results });
        });
    } catch (error) {
        console.error('Error retrieving comments: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Function to retrieve comments by user ID
exports.getCommentsByUserId = async (req, res) => {
    try {
        const { userID } = req.params;

        // Validate user input
        if (!userID) {
            return res.status(400).json({ error: 'userID is a required parameter.' });
        }

        // Query to fetch comments by user ID from the database
        connection.query('SELECT * FROM Comments WHERE UserID = ?', [userID], (error, results, fields) => {
            if (error) {
                console.error('Error retrieving comments by user ID: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching comments.' });
            }

            console.log('Comments retrieved successfully by user ID.');

            // Send the retrieved comments as response
            return res.status(200).json({ comments: results });
        });
    } catch (error) {
        console.error('Error retrieving comments by user ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};



exports.deleteComment = async (req, res) => {
    try {
        const { commentID } = req.params;

        // Validate user input
        if (!commentID) {
            return res.status(400).json({ error: 'commentID is a required field.' });
        }

        // Additional validation for commentID if needed

        connection.query('DELETE FROM Comments WHERE CommentID = ?', [commentID], (error, results, fields) => {
            if (error) {
                console.error('Error deleting comment: ' + error);
                return res.status(500).json({ error: 'An error occurred while deleting the comment.' });
            }

            console.log('Comment deleted successfully.');

            return res.status(200).json({ message: 'Comment deleted successfully.' });
        });
    } catch (error) {
        console.error('Error deleting comment: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

exports.addReply = async (req, res) => {
    try {
        const{commentID} = req.params 
        const {  userID, content } = req.body;

        // Validate user input
        if (!commentID || !userID || !content) {
            return res.status(400).json({ error: 'commentID, userID, and content are required fields.' });
        }

        // Additional validation for commentID, userID, and content if needed

        connection.query('INSERT INTO Replies (CommentID, UserID, Content) VALUES (?, ?, ?)', [commentID, userID, content], (error, results, fields) => {
            if (error) {
                console.error('Error adding reply: ' + error);
                return res.status(500).json({ error: 'An error occurred while adding the reply.' });
            }

            console.log('Reply added successfully.');

            const replyId = results.insertId; // Assuming your database returns the ID of the newly inserted reply

            // Construct the reply object to send in the response
            const newReply = {
                id: replyId,
                commentID: commentID,
                userID: userID,
                content: content
            };

            return res.status(201).json({ message: 'Reply added successfully.', reply: newReply });
        });
    } catch (error) {
        console.error('Error adding reply: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

// ------------------------ likes ------------------------------------------------------------------------------

exports.addLike = async (req, res) => {
    try {
        const { commentID } = req.params;
        console.log(commentID)
        const { userID } = req.body;

        // Validate user input
        if (!commentID || !userID) {
            return res.status(400).json({ error: 'commentID and userID are required fields.' });
        }

        // Additional validation for commentID and userID if needed

        connection.query('INSERT INTO Likes (CommentID, UserID) VALUES (?, ?)', [commentID, userID], (error, results, fields) => {
            if (error) {
                console.error('Error adding like: ' + error);
                return res.status(500).json({ error: 'An error occurred while adding the like.' });
            }

            console.log('Like added successfully.');

            const likeId = results.insertId; // Assuming your database returns the ID of the newly inserted like

            // Construct the like object to send in the response
            const newLike = {
                id: likeId,
                commentID: commentID,
                userID: userID
            };

            return res.status(201).json({ message: 'Like added successfully.', like: newLike });
        });
    } catch (error) {
        console.error('Error adding like: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

// Unlike a comment
exports.unlikeComment = async (req, res) => {
    try {
        const {commentID} =req.params
        const {  userID } = req.body;

        // Validate user input
        if (!commentID || !userID) {
            return res.status(400).json({ error: 'commentID and userID are required fields.' });
        }

        // Additional validation for commentID and userID if needed

        connection.query('DELETE FROM Likes WHERE CommentID = ? AND UserID = ?', [commentID, userID], (error, results, fields) => {
            if (error) {
                console.error('Error removing like: ' + error);
                return res.status(500).json({ error: 'An error occurred while removing the like.' });
            }

            console.log('Like removed successfully.');

            return res.status(200).json({ message: 'Like removed successfully.' });
        });
    } catch (error) {
        console.error('Error removing like: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

// Get total likes for a comment
exports.getTotalLikes = async (req, res) => {
    try {
        const { commentID } = req.params;

        // Validate user input
        if (!commentID) {
            return res.status(400).json({ error: 'commentID is a required field.' });
        }

        // Additional validation for commentID if needed

        connection.query('SELECT COUNT(*) AS totalLikes FROM Likes WHERE CommentID = ?', [commentID], (error, results, fields) => {
            if (error) {
                console.error('Error getting total likes: ' + error);
                return res.status(500).json({ error: 'An error occurred while getting total likes.' });
            }

            const totalLikes = results[0].totalLikes;

            return res.status(200).json({ totalLikes: totalLikes });
        });
    } catch (error) {
        console.error('Error getting total likes: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
