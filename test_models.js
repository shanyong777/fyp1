const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // actually cannot list models directly with getGenerativeModel, need to use model manager if exposed, 
        // or just try a standard one. 
        // The SDK documentation says we might not have a direct list method easily accessible without looking up docs, 
        // but the error message suggested calling ListModels.
        // Let's try 'gemini-pro' which is the most common one.
        console.log("Testing gemini-pro...");
        const proModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await proModel.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
