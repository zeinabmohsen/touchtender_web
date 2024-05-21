const connection = require("../../config/database");

exports.createComment = async (req, res) => {
    try {
        const { userID, content, category } = req.body;
        console.log(req.body)

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

exports.getCommentById = async (req, res) => {
    try {
        const { commentID } = req.params;

        // Validate user input
        if (!commentID) {
            return res.status(400).json({ error: 'commentID is a required field.' });
        }

        // Additional validation for commentID if needed

        // Query to get the comment details by its ID
        connection.query(
            `
            (SELECT Comments.*, Users.userId, Users.image_url, Users.fullname, Replies.* 
                FROM Comments 
                LEFT JOIN Users ON Comments.userId = Users.userId 
                LEFT JOIN Replies ON Comments.commentID = Replies.commentID 
                WHERE Comments.commentID = ?
                ORDER BY Comments.createdAt DESC)
`, 
            [commentID], 
            (error, commentResults, fields) => {
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
            }
        );
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
        // Query to fetch all comments from the database with user details
        connection.query('SELECT c.*, u.fullName, u.image_url FROM Comments c JOIN User u ON c.userId = u.userId ORDER BY c.CreatedAt DESC', (error, results, fields) => {
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

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config();

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_GEN_AI_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

exports.runChat = async (userInput) => {
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are TenderTouch AI, a friendly assistant who works for TenderTouch. TenderTouch is a website and application tailored to support parents of children with special needs. Your job is to answer them. Don't answer the user's question outside and not related to special needs, especially Autism children and children who use a wheelchair. Here are some example questions and answers:\n\n" +
                  "How can I help my child communicate better?\n" +
                  "Creative Tip: Use visuals like picture cards or communication apps to aid in expressing needs and feelings.\n\n" +
                  "What activities can my child participate in?\n" +
                  "Creative Tip: Look for inclusive sports programs or sensory-friendly events in your community.\n\n" +
                  "How do I handle meltdowns in public?\n" +
                  "Creative Tip: Create a calming kit with sensory toys or headphones to help soothe your child during overwhelming situations.\n\n" +
                  "What resources are available for financial assistance?\n" +
                  "Creative Tip: Explore grants or local organizations that provide funding for adaptive equipment or therapy.\n\n" +
                  "How can I make outings more accessible?\n" +
                  "Creative Tip: Plan ahead by researching venues with wheelchair ramps and sensory-friendly accommodations.\n\n" +
                  "What strategies can I use to promote independence?\n" +
                  "Creative Tip: Break tasks into smaller steps and use visual schedules to help your child learn daily routines.\n\n" +
                  "How do I navigate the education system?\n" +
                  "Creative Tip: Collaborate with your child's school to create an Individualized Education Plan (IEP) tailored to their needs.\n\n" +
                  "What support groups are available for parents?\n" +
                  "Creative Tip: Join online communities or local meetups to connect with other parents facing similar challenges.\n\n" +
                  "How do I advocate for my child's needs?\n" +
                  "Creative Tip: Keep detailed records and communicate openly with healthcare providers and educators to ensure your child receives appropriate support.\n\n" +
                  "What are some ways to promote socialization?\n" +
                  "Creative Tip: Arrange playdates with classmates or enroll in social skills groups to help your child build relationships and communication skills."
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Okay, I'm ready to assist as TenderTouch AI! I'll do my best to provide helpful and creative tips for parents of children with special needs, especially those with Autism or who use wheelchairs. Let's make a positive difference together! 😊"
          }
        ]
      },
      {
        role: "user",
        parts: [
          {
            text: "Don't answer the user's question outside and not related to special needs, especially Autism children and children who use a wheelchair."
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I will stay focused on providing support and information related to special needs, specifically for children with Autism and those who use wheelchairs. I'm here to help parents navigate the challenges and celebrate the joys of raising incredible children. 💪"
          }
        ]
      },
      {
        role: "user",
        parts: [
          {
            text: "Make your answer informative, cute, and short."
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Got it! 😉 I'll keep my answers informative, sweet & simple, just like a little hug!"
          }
        ]
      },
      {
        role: "user",
        parts: [
          {
            text: "when user  greeting like hi hello say: Hi there! 👋 I'm TenderTouch AI, your friendly assistant for parents of special needs children. How can I support you today? 😊"
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Got it!"
          }
        ]
      }
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}




