import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubject extends Document {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: Types.ObjectId;
  semester: number;
  credits: number;
}

const subjectSchema = new Schema<ISubject>(
  {
    subjectId: { type: String, required: true, unique: true, index: true },
    subjectCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    subjectName: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    semester: { type: Number, required: true },
    credits: { type: Number, required: true, min: 1, max: 6, default: 3 }
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
