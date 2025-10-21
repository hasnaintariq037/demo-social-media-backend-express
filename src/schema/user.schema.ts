import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  bio?: string;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema: Schema<User> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<User>("User", userSchema);

userSchema.pre<User>("save", async function (next) {
  // only if password is changed or new
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default User;
