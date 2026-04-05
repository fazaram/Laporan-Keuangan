const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const result = await genAI.listModels();
    console.log("Daftar model yang tersedia:");
    result.models.forEach((m) => {
      console.log(`- ${m.name} (Methods: ${m.supportedMethods.join(", ")})`);
    });
  } catch (e) {
    console.error("Gagal mengambil daftar model:", e);
  }
}

listModels();
