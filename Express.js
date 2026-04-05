// Import necessary modules
const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors"); // Import CORS middleware
require("dotenv").config(); // To load the .env file with the API key

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from the frontend
app.use(cors()); // This allows all incoming requests from any origin
// Or if you want to restrict to only your frontend:
// app.use(cors({ origin: 'http://localhost:3000' })); // Allow only frontend on localhost:3000

// Enable JSON parsing for request bodies
app.use(express.json());

// Set up OpenAI API with the key from .env
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Make sure the key is correctly stored in .env
});
const openai = new OpenAIApi(configuration);

// Define a route for content generation
app.get("/generate-content", async (req, res) => {
  const prompt =
    req.query.prompt || "Write an 'About Us' page for a tech company.";

  try {
    // Call OpenAI's API to generate content
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 100,
    });

    // Send the generated content as a response
    res.json({ content: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating content" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
