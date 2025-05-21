const mongoose = require("mongoose");

const connectDB =  () => {
   mongoose.connect(
    "mongodb+srv://Sanjeev:Sanjeev123@cluster0.ybrdh6e.mongodb.net/Tinder"
  ).then(() => console.log("DB Connected Successfully"))
    .catch( (error) => {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    } )
};

module.exports = connectDB;