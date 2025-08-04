import superUserModel from '../models/superUser.model';


export interface ICreateSuperUserParams {
    username: string;
    password: string;
    email?: string | null;
    lounge_name: string;
    current_local_ip?: string;
    last_network_range?: string;
}

export interface IUpdateSuperUserParams {
    _id: string;
    email?: string | null;
    lounge_name?: string;
    settings?: {
        hourly_rate?: number;
        currency?: string;
        timezone?: string;
        session_warning_minutes?: number;
    };
}

export interface IUpdateNetworkInfoParams {
    current_local_ip: string;
    last_network_range: string;
}

export class SuperUserRepository {
    private _model = superUserModel;

    async getSuperUserByUsername(username: string) {
        return this._model.findOne({ username });
    }

    async getSuperUserById(id: string) {
        return this._model.findById(id).select('-password');
    }

    async createSuperUser(params: ICreateSuperUserParams) {
        return this._model.create({
            username: params.username,
            password: params.password,
            email: params.email || null,
            lounge_name: params.lounge_name
        });
    }

    async updateSuperUser(params: IUpdateSuperUserParams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (params.email !== null) {
            updateData.email = params.email;
        }

        if (params.lounge_name) {
            updateData.lounge_name = params.lounge_name;
        }

        if (params.settings) {
            updateData.settings = params.settings;
        }

        return this._model.findByIdAndUpdate(params._id, updateData, { new: true }).select('-password');
    }

    async updateLastLogin(id: string) {
        await this._model.findByIdAndUpdate(id, { last_login: new Date() });
    }

    async updateNetworkInfo(id: string, localIP: string, networkRange: string) {
        // console.log(`🔄 Updating network info for user ${id}: IP=${localIP}, Range=${networkRange}`);

        const result = await this._model.findByIdAndUpdate(id, {
            last_login: new Date(),
            current_local_ip: localIP,
            last_network_range: networkRange
        }, { new: true });

        // console.log(`✅ Network info updated successfully for user ${id}`);
        return result;
    }

    async getNetworkInfo(id: string) {
        const user = await this._model.findById(id).select('current_local_ip last_network_range');

        if(!user) return null;

        return {
            local_ip: user.current_local_ip,
            network_range: user.last_network_range,
            scan_ready: !!(user.current_local_ip && user.last_network_range)
        };
    }

    async getSuperUserByEmail(email: string) {
        return this._model.findOne({ email });
    }

    async updatePassword(id: string, hashedPassword: string) {
        return this._model.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');
    }

    async getSuperUserWithNetworkInfo(id: string) {
        return this._model.findById(id).select('-password');
    }

    async hasValidNetworkInfo(id: string) {
        const user = await this._model.findById(id).select('current_local_ip last_network_range');
        return !!(user?.current_local_ip && user?.last_network_range);
    }
}