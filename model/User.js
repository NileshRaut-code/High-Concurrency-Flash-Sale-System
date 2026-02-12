import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const UserSchema=new mongoose.Schema({
email:{
   type:String,
   required:true,
   index:true
},
phone:{
   type:Number,
},
isblocked:{
   type:Boolean,
   default:false
},
password:{
   type:String,
}
},{timestamps:true})


UserSchema.pre("save",async function(next){
   if(!this.isModified("password")) return next
   this.password=await bcrypt.hash(this.password,10);
   next;
})

UserSchema.methods.Password=async function (password) {
   return await bcrypt.compare(password,this.password);
}

UserSchema.methods.token= function () {
   return jwt.sign({
      _id:this._id,
      email:this.email
   },"asd",{expiresIn:'1d'})
}

export const User=mongoose.model("User",UserSchema)