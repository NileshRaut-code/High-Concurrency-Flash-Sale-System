import mongoose from "mongoose";

const ConnectDb=async()=>{
try {
   await mongoose.connect("mongodb+srv://localhost:27017/flash_sale")
} catch (error) {
   console.log(error);
   
   process.exit(1);

}
}

export {ConnectDb};