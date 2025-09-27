import { Request, Response } from 'express';
import { KnowledgeBase } from '../models';
import { KnowledgeEntry, KnowledgeEntryDocument, ApiResponse } from '../types';
import { transformKnowledgeEntry } from '../utils/transform';

export const getKnowledgeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const entryDocs = await KnowledgeBase.find({}).sort({ lastUpdated: -1 });
    const entries = entryDocs.map(doc => transformKnowledgeEntry(doc as any as KnowledgeEntryDocument));

    res.json(entries);
  } catch (error) {
    console.error('Get knowledge entries error:', error);
    res.status(500).json([]);
  }
};

export const createKnowledgeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag, content }: { tag: string; content: string } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entry = new KnowledgeBase({
      tag,
      content,
      updatedBy: req.user.username,
      lastUpdated: new Date()
    });

    await entry.save();
    const transformedEntry = transformKnowledgeEntry(entry as any as KnowledgeEntryDocument);

    res.json(transformedEntry);
  } catch (error) {
    console.error('Create knowledge entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateKnowledgeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tag, content }: { tag: string; content: string } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entry = await KnowledgeBase.findByIdAndUpdate(
      id,
      {
        tag,
        content,
        updatedBy: req.user.username,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      res.status(404).json({ success: false, message: 'Knowledge entry not found' });
      return;
    }

    const transformedEntry = transformKnowledgeEntry(entry as any as KnowledgeEntryDocument);
    res.json(transformedEntry);
  } catch (error) {
    console.error('Update knowledge entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteKnowledgeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const entry = await KnowledgeBase.findByIdAndDelete(id);

    if (!entry) {
      res.status(404).json({ success: false, message: 'Knowledge entry not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete knowledge entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};