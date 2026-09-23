import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  name: string;
  email: string;
  departmentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  semester: number;
  academicYear: string;
}

const studentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const Student = mongoose.model<IStudent>('Student', studentSchema);
