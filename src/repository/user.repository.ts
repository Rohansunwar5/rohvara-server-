// import userModel, { IUser } from '../models/user.model';
// import { sha1 } from '../utils/hash.util';

// export interface IOnBoardUserParams {
//   firstName: string;
//   lastName: string;
//   isdCode?: string;
//   phoneNumber?: string;
//   email: string;
//   password?: string;
//   verificationCode: string;
//   verified?: boolean;
//   img: {
//     link: string;
//     source: string;
//   }
// }

// export class UserRepository {
//   private _model = userModel;

//   async getUserByEmailId(email: string): Promise<IUser | null> {
//     return this._model.findOne({ email });
//   }

//   async onBoardUser(params: IOnBoardUserParams): Promise<IUser> {
//     const {
//       firstName, lastName, isdCode, phoneNumber, email,
//       password, verificationCode, verified, img
//     } = params;

//     return this._model.create({
//       firstName, lastName, isdCode, phoneNumber,
//       email, password, verificationCode, verified, img
//     });
//   }

//   async getUserById(id: string) {
//     return this._model.findById(id).select('img _id firstName lastName email isdCode phoneNumber verified createdAt updatedAt __v');
//   }

//   async updateUser(params: {
//     firstName: string, lastName: string, isdCode?: string, phoneNumber?: string, _id: string, bio?: string, location?: string, company?: { name?: string, url?: string }, socials?: {
//       twitter?: string,
//       github?: string,
//       facebook?: string,
//       instagram?: string,
//       linkedin?: string,
//     }
//   }) {
//     const { firstName, lastName, isdCode, phoneNumber, _id, bio, location, company, socials } = params;

//     return this._model.findByIdAndUpdate(_id, { firstName, lastName, isdCode, phoneNumber, bio, location, company, socials }, { new: true });
//   }

//   async updateVerificationCode(userId: string, verificationCode: string) {
//     return this._model.findByIdAndUpdate(userId, {
//       verificationCode
//     }, { new: true });
//   }

//   async verifyUser(code: string) {
//     return this._model.findOneAndUpdate({ verificationCode: sha1(code) }, {
//       verified: true
//     });
//   }

//   async verifyUserId(userId: string) {
//     return this._model.findByIdAndUpdate(userId, {
//       verified: true
//     }, { new: true });
//   }

//   async getUserWithVerificationCode(code: string) {
//     return this._model.findOne({ verificationCode: sha1(code) });
//   }

//   async resetPassword(code: string, hashedPassword: string) {
//     return this._model.findOneAndUpdate({ verificationCode: sha1(code) }, {
//       password: hashedPassword
//     }, { new: true });
//   }

//   async updateUserProfileImage(userId: string, fileName: string) {
//     return this._model.findOneAndUpdate({ _id: userId }, {
//       img: {
//         link: fileName,
//         source: 'bucket'
//       }
//     }, { new: true });
//   }

//   async deleteAccount(userId: string) {
//     return this._model.findOneAndUpdate({ _id: userId }, {
//       firstName: 'Deleted Account',
//       lastName: 'Deleted Account',
//       isdCode: 'Deleted Account',
//       phoneNumber: 'Deleted Account',
//       email: `${Math.random()}@email.com`,
//       deletedAccount: true,
//       verificationCode: null,
//       verified: false,
//       password: null,
//     }, { new: true });
//   }

// }