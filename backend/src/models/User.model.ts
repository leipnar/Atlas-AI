import mongoose, { Schema, Document } from 'mongoose';

export interface IPasskeyCredential {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports?: string[];
}

export interface IUser extends Document {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'support' | 'client';
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: {
    timestamp: Date;
    ip: string;
    device: string;
    os: string;
  };
  passkeyCredentials?: IPasskeyCredential[];
  currentChallenge?: string;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid mobile number']
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'supervisor', 'support', 'client'],
    default: 'client'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    timestamp: {
      type: Date
    },
    ip: {
      type: String
    },
    device: {
      type: String
    },
    os: {
      type: String
    }
  },
  passkeyCredentials: [{
    credentialID: {
      type: String,
      required: true
    },
    credentialPublicKey: {
      type: String,
      required: true
    },
    counter: {
      type: Number,
      required: true,
      default: 0
    },
    transports: [{
      type: String
    }]
  }],
  currentChallenge: {
    type: String
  }
}, {
  timestamps: true
});

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
