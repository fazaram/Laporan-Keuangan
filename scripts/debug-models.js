const fs = require('fs');
require('dotenv').config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    fs.writeFileSync('available_models.json', JSON.stringify({ error: "API Key tidak ditemukan di .env" }, null, 2));
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      fs.writeFileSync('available_models.json', JSON.stringify({ 
        api_error: data.error.message, 
        status: data.error.status,
        details: data.error
      }, null, 2));
    } else {
      fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
    }
    console.log("Hasil diagnostik berhasil disimpan ke available_models.json");
  } catch (e) {
    fs.writeFileSync('available_models.json', JSON.stringify({ 
      fetch_error: e.message 
    }, null, 2));
    console.error("Gagal melakukan fetch:", e.message);
  }
}

checkModels();
