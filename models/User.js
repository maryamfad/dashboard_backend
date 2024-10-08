import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  portfolio: [
    {
      stockSymbol: String,
      quantity: Number,
      purchasePrice: Number,
    },
  ],
  balance: { type: Number, default: 10000 },
  cash: { type: Number, default:0},
  dailyChange: { type: Number, default:0}
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
