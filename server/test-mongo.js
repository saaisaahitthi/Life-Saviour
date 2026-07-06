const mongoose = require('mongoose');

const uri = "mongodb+srv://saaisaahitthi98_db_user:Sreevissu2008@resumebuilder.rpbnu9e.mongodb.net/lifesaviour?retryWrites=true&w=majority&appName=resumebuilder";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ SUCCESS!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ ERROR:", err);
    process.exit(1);
  });
