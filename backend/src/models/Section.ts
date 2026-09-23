import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISection extends Document {
  sectionId: string;
  name: string;
  classId: Types.ObjectId;
}

const sectionSchema = new Schema<ISection>(
  {
    sectionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true }
  },
  { timestamps: true }
);

export const Section = mongoose.model<ISection>('Section', sectionSchema);
