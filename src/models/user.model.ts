// import mongoose from 'mongoose';


// const userSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//       maxLength: 40,
//     },
//     lastName: {
//       type: String,
//       trim: true,
//       maxLength: 40,
//     },
//     email: {
//       type: String,
//       required: true,
//       minLength: 2,
//     },
//     phoneNumber: {
//       type: String,
//       minLength: 5,
//       maxLength: 40,
//     },
//     venueId: {
//       type: String,
//       required: true,
//     },
//     totalSessions: {
//       type: Number,
//       default: 0,
//     },
//     totalAmount: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// userSchema.index({ venueId: 1 });
// userSchema.index({ email: 1, venueId: 1 });

// export interface IUser extends mongoose.Schema {
//   _id?: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phoneNumber: string;
//   venueId: string;
//   totalSessions: number;
//   totalAmount: number;
// }

// export default mongoose.model<IUser>('User', userSchema);
