const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCy_NjJy6Dd5NIiqDLEZGpeChlXS3-jkq0");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function test() {
  try {
    const result = await model.generateContent("hello");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}
test();
