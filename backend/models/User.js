const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'team', 'client'], default: 'client' },
    title: { type: String, default: '' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
