import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  image: {
    type: String
  },
  role: {
    type: String,
    enum: ['Customer', 'Admin'],
    default: 'Customer'
  },
  phone: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'user', // Direct map to Better Auth's user collection
  _id: false // Disable Mongoose automatic ObjectId generation since Better Auth handles string IDs
});

// Indexes for performance
// userSchema.index({ email: 1 }); // email is already unique

const User = mongoose.model('User', userSchema);
export default User;
