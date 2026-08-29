import mongoose, { mongo } from "mongoose";

const connectDB = async () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected : ${(await conn).connection.host}`
    )
  }
  catch (error) {
    console.log(error.message);
    process.exit(1);
  }
}

export default connectDB;

