import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { DeviceStatus } from '../models/device.model';
import { DeviceRepository, IAddGameParams, ICreateDeviceParams, IUpdateDeviceParams, IUpdateDeviceStatusParams } from '../repository/device.repository';

class DeviceService{
  constructor(private readonly _deviceRepository: DeviceRepository) {}

  async registerDevice(params: { loungeId: string, pc_id: string, pc_name: string, ip_address: string, mac_address: string, specs?: { ram?: string, gpu?: string, cpu?: string}})
  {
    const { loungeId, pc_id, pc_name, ip_address, mac_address, specs } = params;

    const existingDevice = await this._deviceRepository.getDeviceByPcId(loungeId, pc_id);
    if(existingDevice) {
      throw new BadRequestError('Pc id alreadt exists in this lounge');
    }

    const createDeviceParams: ICreateDeviceParams = {
      pc_id: pc_id,
        pc_name: pc_name,
        ip_address: ip_address,
        mac_address: mac_address || null,
        specs: specs || {
            ram: null,
            gpu: null,
            cpu: null
        }
    };

    const device = await this._deviceRepository.createDevice(loungeId, createDeviceParams);

    return {
        device: {
            id: device._id,
            pc_id: device.pc_id,
            pc_name: device.pc_name,
            ip_address: device.ip_address,
            mac_address: device.mac_address,
            status: device.status,
            specs: device.specs,
            createdAt: device.createdAt
        }
    };
  }


  async getAllDevices(params: { loungeId: string; status?: string }) {
    const { loungeId, status } = params;

    let deviceStatus: DeviceStatus | undefined = undefined;
    if (status === 'available') deviceStatus = DeviceStatus.AVAILABLE;
    else if (status === 'in_use') deviceStatus = DeviceStatus.IN_USE;
    else if (status === 'offline') deviceStatus = DeviceStatus.OFFLINE;
    else if (status === 'maintenance') deviceStatus = DeviceStatus.MAINTENANCE;

    const devices = await this._deviceRepository.getAllDevices(loungeId, deviceStatus);

    return {
        devices: devices.map(device => ({
            id: device._id,
            pc_id: device.pc_id,
            pc_name: device.pc_name,
            ip_address: device.ip_address,
            mac_address: device.mac_address,
            status: device.status,
            current_user_id: device.current_user_id,
            current_session_id: device.current_session_id,
            last_heartbeat: device.last_heartbeat,
            specs: device.specs,
            installed_games: device.installed_games,
            createdAt: device.createdAt
      }))
    };
  }

  async getDeviceById(params: { loungeId: string; deviceId: string }) {
    const { loungeId, deviceId } = params;

    const device = await this._deviceRepository.getDeviceById(loungeId, deviceId);
    if (!device) throw new NotFoundError('Device not found');

    return {
        device: {
            id: device._id,
            pc_id: device.pc_id,
            pc_name: device.pc_name,
            ip_address: device.ip_address,
            mac_address: device.mac_address,
            status: device.status,
            current_user_id: device.current_user_id,
            current_session_id: device.current_session_id,
            last_heartbeat: device.last_heartbeat,
            specs: device.specs,
            installed_games: device.installed_games,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt
        }
    };
  }

  async updateDevice(params: { loungeId: string, deviceId: string, pc_name?: string, ip_address?: string, mac_address?: string, specs?: { ram?: string, gpu?: string, cpu?: string }}) {
    const { loungeId, deviceId, pc_name, ip_address, mac_address, specs } = params;

    const existingDevice = await this._deviceRepository.getDeviceById(loungeId, deviceId);
    if (!existingDevice) throw new NotFoundError('Device not found');

    const updateParams: IUpdateDeviceParams = {
        _id: deviceId
    };

    if (pc_name) {
        updateParams.pc_name = pc_name;
    }

    if (ip_address) {
        updateParams.ip_address = ip_address;
    }

    if (mac_address !== null) {
        updateParams.mac_address = mac_address || null;
    }

    if (specs) {
        updateParams.specs = {
            ram: specs.ram || null,
            gpu: specs.gpu || null,
            cpu: specs.cpu || null
        };
    }

    const updatedDevice = await this._deviceRepository.updateDevice(loungeId, updateParams);
    if (!updatedDevice) throw new BadRequestError('Failed to update device');

    return {
        device: {
            id: updatedDevice._id,
            pc_id: updatedDevice.pc_id,
            pc_name: updatedDevice.pc_name,
            ip_address: updatedDevice.ip_address,
            mac_address: updatedDevice.mac_address,
            status: updatedDevice.status,
            specs: updatedDevice.specs,
            updatedAt: updatedDevice.updatedAt
        }
    };
  }

  async updateDeviceStatus(params: { loungeId: string, deviceId: string, status: string, current_user_id?: string, current_session_id?: string }) {
    const { loungeId, deviceId, status, current_user_id, current_session_id } = params;

    // Check if device exists
    const existingDevice = await this._deviceRepository.getDeviceById(loungeId, deviceId);
    if (!existingDevice) throw new NotFoundError('Device not found');

    // Convert status string to enum
    let deviceStatus: DeviceStatus;
    if (status === 'available') deviceStatus = DeviceStatus.AVAILABLE;
    else if (status === 'in_use') deviceStatus = DeviceStatus.IN_USE;
    else if (status === 'offline') deviceStatus = DeviceStatus.OFFLINE;
    else if (status === 'maintenance') deviceStatus = DeviceStatus.MAINTENANCE;
    else throw new BadRequestError('Invalid device status');

    // Update status params
    const updateStatusParams: IUpdateDeviceStatusParams = {
        device_id: deviceId,
        status: deviceStatus,
        current_user_id: current_user_id || null,
        current_session_id: current_session_id || null
    };

    // Update device status
    const updatedDevice = await this._deviceRepository.updateDeviceStatus(loungeId, updateStatusParams);
    if (!updatedDevice) throw new BadRequestError('Failed to update device status');

    return {
        device: {
            id: updatedDevice._id,
            pc_id: updatedDevice.pc_id,
            pc_name: updatedDevice.pc_name,
            status: updatedDevice.status,
            current_user_id: updatedDevice.current_user_id,
            current_session_id: updatedDevice.current_session_id,
            last_heartbeat: updatedDevice.last_heartbeat
        }
    };
  }

  async addGameToDevice(params: { loungeId: string, deviceId: string, name: string, executable: string, icon_path?: string}) {
    const { loungeId, deviceId, name, executable, icon_path } = params;

    const existingDevice = await this._deviceRepository.getDeviceById(loungeId, deviceId);
    if(!existingDevice) throw new NotFoundError('Device not Found');

    const addGameParams: IAddGameParams = { device_id: deviceId, name: name, executable: executable, icon_path: icon_path || null };

    const updatedDevice = await this._deviceRepository.addGameToDevice(loungeId, addGameParams);
    if(!updatedDevice) throw new BadRequestError('Failed to add game to device');

    return {
      device: {
        id: updatedDevice._id,
        pc_id: updatedDevice.pc_id,
        pc_name: updatedDevice.pc_name,
        installed_games: updatedDevice.installed_games
      }
    };
  }

  async removeGameFromDevice(params: { loungeId: string, deviceId: string, gameName: string })
  {
    const { loungeId, deviceId, gameName } = params;

    const existingDevice = await this._deviceRepository.getDeviceById(loungeId, deviceId);
    if (!existingDevice) throw new NotFoundError('Device not found');

    const updatedDevice = await this._deviceRepository.removeGameFromDevice(loungeId, deviceId, gameName);
    if (!updatedDevice) throw new BadRequestError('Failed to remove game from device');

    return {
        device: {
            id: updatedDevice._id,
            pc_id: updatedDevice.pc_id,
            pc_name: updatedDevice.pc_name,
            installed_games: updatedDevice.installed_games
        }
    };
  }

  async getDeviceStats(params: { loungeId: string }) {
    const { loungeId } = params;
    const stats = await this._deviceRepository.getDeviceStats(loungeId);

    const deviceStats = stats[0] || {
      total_devices: 0,
      available_devices: 0,
      in_use_devices: 0,
      offline_devices: 0,
      maintenance_devices: 0
    };

    return {
      stats: deviceStats
    };
  }

  async updateHeartbeat(params: { loungeId: string, pcId: string }) {
    const { loungeId, pcId } = params;

    const exisitingDevice = await this._deviceRepository.getDeviceByPcId(loungeId, pcId);
    if(!exisitingDevice) throw new NotFoundError('Device not found');

    await this._deviceRepository.updateHeartbeat(loungeId, pcId);

    return {
      success: true,
      timestamp: new Date().toString()
    };
  }

  async getOfflineDevices(params: { loungeId: string, minutesOffline?: number }) {
    const { loungeId, minutesOffline } = params;
    const offLineThreshold = minutesOffline || 5;

    const offlineDevices = await this._deviceRepository.getOfflineDevices(loungeId, offLineThreshold);

    return {
      offline_devices: offlineDevices.map(device => ({
          id: device._id,
          pc_id: device.pc_id,
          pc_name: device.pc_name,
          last_heartbeat: device.last_heartbeat,
          minutes_offline: Math.floor((Date.now() - device.last_heartbeat.getTime()) / 60000)
      }))
    };
  }
}


export default new DeviceService(new DeviceRepository());