import mongoose, { Schema, Document } from 'mongoose';
import { KnowledgeEntryDocument } from '../types';

export interface IKnowledgeEntry extends Omit<KnowledgeEntryDocument, '_id'>, Document {}

const KnowledgeBaseSchema: Schema = new Schema({
  tag: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

KnowledgeBaseSchema.index({ tag: 1 });
KnowledgeBaseSchema.index({ updatedBy: 1 });
KnowledgeBaseSchema.index({ lastUpdated: -1 });

export default mongoose.model<IKnowledgeEntry>('KnowledgeBase', KnowledgeBaseSchema);