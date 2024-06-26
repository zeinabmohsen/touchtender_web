const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

exports.createActivityForm = async (req, res) => {
    try {
        const { age, gender, diagnosis, medications, resources, interests, anything } = req.body;

        const prompt = `Give activity ideas for parents with special needs children in the fields of Cooking and Baking,
        Art and Crafts, Sensory Play, Outdoor Exploration, Storytelling, and Board Games where the child is ${age} years old, 
        ${gender}, diagnosed with ${diagnosis}, taking medications: ${medications}, and interested in ${interests}. 
        Additional information: ${anything}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text(); 
        const activitySections = text.split("**");
        const activitiesByField = {};

    
        for (let i = 1; i < activitySections.length; i += 2) {
            const field = activitySections[i].trim();
            let activities = activitySections[i + 1].trim().split("\n\n- ");
            
         
            activities = activities.map(activity => activity.trim().replace(/^\*|\*$/g, ''));

            activitiesByField[field] = activities.filter(activity => activity !== "");
        }

        const successMessage = "Activity form created successfully";
        const generatedText = activitiesByField;

        // Send success message
        res.status(200).json({ success: true, message: successMessage, generatedText });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

