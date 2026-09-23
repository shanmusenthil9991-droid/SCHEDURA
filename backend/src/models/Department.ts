import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  departmentId: string;
  name: string;
  code: string;
}

const departmentSchema = new Schema<IDepartment>(
  {
    departmentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true }
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
