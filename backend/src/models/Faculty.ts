import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFaculty extends Document {
  facultyId: string;
  name: string;
  email: string;
  departmentId: Types.ObjectId;
  designation: string;
  inChargeClassId?: Types.ObjectId;
  inChargeSectionId?: Types.ObjectId;
  inChargeAcademicYear?: string;
}

const facultySchema = new Schema<IFaculty>(
  {
    facultyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    designation: { type: String, required: true, trim: true },
    inChargeClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
    inChargeSectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    inChargeAcademicYear: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Faculty = mongoose.model<IFaculty>('Faculty', facultySchema);
