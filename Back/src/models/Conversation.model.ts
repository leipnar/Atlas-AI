import mongoose, { Schema, Document } from 'mongoose';
import { Message } from '../types';

export interface IConversation extends Document {
  userId: string;
  startTime: Date;
  messages: Message[];
}

const MessageSchema: Schema = new Schema({
  id: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'atlas']
  },
  text: {
    type: String,
    required: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  isError: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    enum: ['good', 'bad', null],
    default: null
  }
}, { _id: false });

const ConversationSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  messages: [MessageSchema]
}, {
  timestamps: true
});

ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ startTime: -1 });
ConversationSchema.index({ 'messages.id': 1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);