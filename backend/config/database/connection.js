const mongoose = require("mongoose");
const logger = require("../../utils/logger");

const connectDB = async () => {

    await mongoose.connect(process.env.MONGO_URI).then(() => {
        logger.info("MongoDB connected successfully");
    }).catch((error) => {
        logger.error(`Database connection Error: ${error.message}`, { stack: error.stack });
        process.exit(1);
    })

}


module.exports = connectDB;