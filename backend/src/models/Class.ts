import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  classId: string;
  name: string;
  departmentId: Types.ObjectId;
  semester: number;
  academicYear: string;
}

const classSchema = new Schema<IClass>(
  {
    classId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const Class = mongoose.model<IClass>('Class', classSchema);
