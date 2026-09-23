import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'ADMIN' | 'FACULTY_COORDINATOR' | 'STUDENT';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  facultyId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  semester?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'FACULTY_COORDINATOR', 'STUDENT'],
      required: true,
      default: 'STUDENT'
    },
    facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    semester: { type: Number },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
