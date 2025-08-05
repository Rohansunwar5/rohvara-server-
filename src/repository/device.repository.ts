import mongoose from 'mongoose';
import deviceModel, { DeviceStatus, IDevice } from '../models/device.model';

export interface ICreateDeviceParams {
    pc_id: string;
    pc_name: string;
    ip_address: string;
    mac_address?: string | null;
    specs?: {
        ram?: string | null;
        gpu?: string | null;
        cpu?: string | null;
    }
}

export interface IUpdateDeviceParams {
    _id: string;
    pc_name?: string;
    ip_address?: string;
    mac_address?: string | null;
    specs?: {
        ram?: string | null;
        gpu?: string | null;
        cpu?: string | null;
    };
}

export interface IUpdateDeviceStatusParams {
    device_id: string;
    status: DeviceStatus;
    current_user_id?: string | null;
    current_session_id?: string | null;
}

export interface IAddGameParams {
    device_id: string;
    name: string;
    executable: string;
    icon_path?: string | null;
}

export class DeviceRepository {
    private _model = deviceModel;

    async getDeviceByPcId(loungeId: string, pcId: string): Promise<IDevice | null> {
    if (loungeId === '') {
        return this._model.findOne({ pc_id: pcId });
    }

    return this._model.findOne({ lounge_id: loungeId, pc_id: pcId });
}

    async getDeviceById(loungeId: string, deviceId: string) {
        return this._model.findOne({ lounge_id: loungeId, _id: deviceId });
    }

    async getAllDevices(loungeId: string, status?: DeviceStatus) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { lounge_id: loungeId };
        if(status) filter.status = status;

        return this._model.find(filter).sort({ createdAt: -1 });
    }

    async createDevice(loungeId: string, params: ICreateDeviceParams) {
        return this._model.create({
            lounge_id: loungeId,
            pc_id: params.pc_id,
            pc_name: params.pc_name,
            ip_address: params.ip_address,
            mac_address: params.mac_address || null,
            specs: params.specs || {
                ram: null,
                gpu: null,
                cpu: null
            },
            status: DeviceStatus.OFFLINE,
            installed_games: []
        });
    }

    async updateDevice(loungeId: string, params: IUpdateDeviceParams): Promise<IDevice | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (params.pc_name) {
            updateData.pc_name = params.pc_name;
        }

        if (params.ip_address) {
            updateData.ip_address = params.ip_address;
        }

        if (params.mac_address !== null) {
            updateData.mac_address = params.mac_address;
        }

        if (params.specs) {
            updateData.specs = params.specs;
        }

        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: params._id },
            updateData,
            { new: true }
        );
    }

    async updateDeviceStatus(loungeId: string, params: IUpdateDeviceStatusParams): Promise<IDevice | null> {
        // console.log('🔄 Updating device status:', {
        //     loungeId,
        //     deviceId: params.device_id,
        //     newStatus: params.status,
        //     userId: params.current_user_id,
        //     sessionId: params.current_session_id
        // });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            status: params.status,
            last_heartbeat: new Date()
        };

        if (params.current_user_id !== null) {
            updateData.current_user_id = params.current_user_id;
        }

        if (params.current_session_id !== null) {
            updateData.current_session_id = params.current_session_id;
        }

        // console.log('🔄 Update data:', updateData);

        const result = await this._model.findOneAndUpdate(
        { lounge_id: loungeId, _id: new mongoose.Types.ObjectId(params.device_id) },
        updateData,
        { new: true }
    );

        // console.log('✅ Device updated:', result ? {
        //     id: result._id,
        //     status: result.status,
        //     current_user_id: result.current_user_id,
        //     current_session_id: result.current_session_id
        // } : 'UPDATE FAILED');

        return result;
    }

    async updateHeartbeat(loungeId: string, pcId: string) {
        await this._model.findOneAndUpdate(
            { lounge_id: loungeId, pc_id: pcId },
            {
                last_heartbeat: new Date(),
            }
        );
    }

    async addGameToDevice(loungeId: string, params: IAddGameParams): Promise<IDevice | null> {
        const newGame = {
            name: params.name,
            executable: params.executable,
            icon_path: params.icon_path || null
        };

        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: params.device_id },
            { $addToSet: { installed_games: newGame } },
            { new: true }
        );
    }

    async removeGameFromDevice(loungeId: string, deviceId: string, gameName: string) {
        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: deviceId },
            { $pull: { installed_games: { name: gameName } } },
            { new: true }
        );
    }

    async getDeviceStats(loungeId: string) {
        return this._model.aggregate([
            { $match: { lounge_id: loungeId } },
            {
                $group: {
                    _id: null,
                    total_devices: { $sum: 1 },
                    available_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                    },
                    in_use_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'in_use'] }, 1, 0] }
                    },
                    offline_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
                    },
                    maintenance_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
                    }
                }
            }
        ]);
    }

    async getOfflineDevices(loungeId: string, minutesOffline: number): Promise<IDevice[]> {
        const cutoffTime = new Date(Date.now() - minutesOffline * 60 * 1000);

        return this._model.find({
            lounge_id: loungeId,
            last_heartbeat: { $lt: cutoffTime },
            status: { $ne: DeviceStatus.MAINTENANCE }
        });
    }

    async checkDeviceExists(loungeId: string, pcId: string, ipAddress: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            $or: [
                { pc_id: pcId },
                { ip_address: ipAddress }
            ]
        });
    }

    async getDevicesByNetworkRange(loungeId: string, networkRange: string): Promise<IDevice[]> {
        const regex = new RegExp(`^${networkRange}\\.`);
        return this._model.find({
            lounge_id: loungeId,
            ip_address: { $regex: regex }
        });
    }

    async getNetworkRangeStats(loungeId: string, networkRange: string) {
        const regex = new RegExp(`^${networkRange}\\.`);
        return this._model.aggregate([
            {
                $match: {
                    lounge_id: loungeId,
                    ip_address: { $regex: regex }
                }
            },
            {
                $group: {
                    _id: null,
                    total_devices: { $sum: 1 },
                    available_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                    },
                    in_use_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'in_use'] }, 1, 0] }
                    },
                    offline_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
                    },
                    maintenance_devices: {
                        $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
                    }
                }
            }
        ]);
    }
}