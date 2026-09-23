import mongoose, { Document, Schema, Types } from 'mongoose';

export type TimetableStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ITimetable extends Document {
  timetableId: string;
  departmentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  semester: number;
  academicYear: string;
  version: number;
  status: TimetableStatus;
  createdBy: Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timetableSchema = new Schema<ITimetable>(
  {
    timetableId: { type: String, required: true, unique: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    semester: { type: Number, required: true, index: true },
    academicYear: { type: String, required: true, trim: true, index: true },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      required: true,
      default: 'DRAFT',
      index: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound index for querying active timetables quickly
timetableSchema.index({
  departmentId: 1,
  classId: 1,
  sectionId: 1,
  semester: 1,
  academicYear: 1,
  status: 1
});

export const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
