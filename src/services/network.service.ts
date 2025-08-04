import axios from 'axios';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { DeviceRepository } from '../repository/device.repository';
import { SuperUserRepository } from '../repository/superUser.repository';

interface IDiscoveredDevice {
    ip_address: string;
    pc_id: string;
    pc_name: string;
    mac_address?: string;
    specs?: {
        ram?: string | null;
        gpu?: string | null;
        cpu?: string | null;
    };
    client_version?: string;
    discovered_at: Date;
    status: string;
    service?: string;
}


class NetworkService {
    constructor ( private readonly _superUserRepository: SuperUserRepository, private readonly _deviceRepository: DeviceRepository) {}

    async getNetworkInfo(params: { userId: string }) {
        const { userId } = params;
        const networkInfo = await this._superUserRepository.getNetworkInfo(userId);

        if (!networkInfo) throw new NotFoundError('User not found');

        return { network_info: networkInfo };
    }

    async scanNetworkDevices(params: { userId: string, loungeId: string }) {
        const { userId, loungeId } = params;
        const superUser = await this._superUserRepository.getSuperUserWithNetworkInfo(userId);

        if (!superUser || !superUser.last_network_range) throw new BadRequestError('Network range not available. Please login again to detect your network.');

        const networkRange = superUser.last_network_range;
        // console.log(`🔍 Starting network scan for range: ${networkRange}.1-254`);

        const registeredDevices = await this._deviceRepository.getAllDevices(loungeId);
        const registeredIPs = new Set(registeredDevices.map(d => d.ip_address));
        const registeredPCIds = new Set(registeredDevices.map(d => d.pc_id));

        const scanPromises: Promise<IDiscoveredDevice | null>[] = [];

        const BATCH_SIZE = 20;
        const SCAN_TIMEOUT = 2000;

        for (let i = 1; i <= 254; i++) {
            const targetIP = `${networkRange}.${i}`;

            if (i === 1 || targetIP === superUser.current_local_ip) {
                continue;
            }

            if (registeredIPs.has(targetIP)) {
                // console.log(`⏭️  Skipping ${targetIP} - already registered`);
                continue;
            }

            scanPromises.push(this.scanSingleDevice(targetIP, SCAN_TIMEOUT));
        }

        // console.log(`📡 Scanning ${scanPromises.length} potential devices...`);

        const allResults: IDiscoveredDevice[] = [];

        for(let i = 0; i < scanPromises.length; i += BATCH_SIZE) {
            const batch = scanPromises.slice(i, i + BATCH_SIZE);
            // console.log(`🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(scanPromises.length/BATCH_SIZE)}...`);

            const batchResults = await Promise.allSettled(batch);

            batchResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    const device = result.value;

                    // Double-check PC ID not already registered
                    if (!registeredPCIds.has(device.pc_id)) {
                        allResults.push(device);
                        // console.log(`✅ Found gaming PC: ${device.pc_name} (${device.ip_address})`);
                    } else {
                        // console.log(`⚠️  PC ID ${device.pc_id} already registered with different IP`);
                    }
                }
            });

            if(i + BATCH_SIZE < scanPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // console.log(`✅ Network scan complete: Found ${allResults.length} new gaming clients`);

        return {
            discovered_devices: allResults,
            registered_devices: registeredDevices.map(d => ({
                pc_id: d.pc_id,
                pc_name: d.pc_name,
                ip_address: d.ip_address,
                status: d.status
            })),
            network_range: networkRange,
            scan_summary: {
                total_ips_scanned: scanPromises.length,
                new_devices_found: allResults.length,
                already_registered: registeredDevices.length,
                total_devices: allResults.length + registeredDevices.length
            }
        };
    }

    //local testing,
    // async scanNetworkDevices(params: { userId: string, loungeId: string }) {
    //     const { userId, loungeId } = params;

    //     // Get superuser network info
    //     const superUser = await this._superUserRepository.getSuperUserWithNetworkInfo(userId);
    //     if (!superUser || !superUser.last_network_range) {
    //         throw new BadRequestError('Network range not available. Please login again to detect your network.');
    //     }

    //     const networkRange = superUser.last_network_range; // e.g., "192.168.1"
    //     const localIP = superUser.current_local_ip;

    //     console.log(`🔍 Admin IP: ${localIP}, Network Range: ${networkRange}`);

    //     // Get already registered devices to filter out
    //     const registeredDevices = await this._deviceRepository.getAllDevices(loungeId);
    //     const registeredIPs = new Set(registeredDevices.map(d => d.ip_address));
    //     const registeredPCIds = new Set(registeredDevices.map(d => d.pc_id));

    //     const discoveredDevices: IDiscoveredDevice[] = [];
    //     const scanPromises: Promise<IDiscoveredDevice | null>[] = [];

    //     // 🧪 Check if this is localhost/development environment
    //     const isLocalTesting = localIP === '::1' ||
    //                           localIP === '127.0.0.1' ||
    //                           localIP.includes('localhost');

    //     if (isLocalTesting) {
    //         // 🧪 LOCAL TESTING MODE: Scan localhost ports 3001-3010
    //         console.log('🧪 LOCAL TESTING MODE: Scanning localhost:3001-3010');

    //         for (let port = 3001; port <= 3010; port++) {
    //             scanPromises.push(this.scanLocalhostPort(port));
    //         }
    //     } else {
    //         // 🌐 PRODUCTION MODE: Scan actual network range
    //         console.log(`🌐 PRODUCTION MODE: Scanning ${networkRange}.1-254:3001`);

    //         for (let i = 1; i <= 254; i++) {
    //             const targetIP = `${networkRange}.${i}`;

    //             // Skip if already registered
    //             if (registeredIPs.has(targetIP)) {
    //                 continue;
    //             }

    //             scanPromises.push(this.scanSingleDevice(targetIP));
    //         }
    //     }

    //     console.log(`📡 Scanning ${scanPromises.length} potential devices...`);

    //     const results = await Promise.allSettled(scanPromises);

    //     results.forEach((result, index) => {
    //         if (result.status === 'fulfilled' && result.value) {
    //             const device = result.value;

    //             // Skip if PC ID already registered
    //             if (!registeredPCIds.has(device.pc_id)) {
    //                 discoveredDevices.push(device);
    //             }
    //         }
    //     });

    //     console.log(`✅ Network scan complete: Found ${discoveredDevices.length} new gaming clients`);

    //     return {
    //         discovered_devices: discoveredDevices,
    //         registered_devices_count: registeredDevices.length,
    //         network_range: networkRange,
    //         scan_mode: isLocalTesting ? 'localhost_testing' : 'production_network',
    //         admin_ip: localIP,
    //         scan_summary: {
    //             total_scanned: scanPromises.length,
    //             discovered: discoveredDevices.length,
    //             already_registered: registeredDevices.length
    //         }
    //     };
    // }

    // private async scanLocalhostPort(port: number): Promise<IDiscoveredDevice | null> {
    //     try {
    //         const response = await axios.get(`http://localhost:${port}/client-info`, {
    //             timeout: 2000,
    //             headers: {
    //                 'User-Agent': 'Gaming-Lounge-Scanner/1.0'
    //             }
    //         });

    //         if (response.data && response.data.service === 'gaming-lounge-client') {
    //             console.log(`🎮 Found gaming client at localhost:${port}: ${response.data.pc_name}`);

    //             return {
    //                 ip_address: response.data.ip_address || `localhost:${port}`,
    //                 pc_id: response.data.pc_id,
    //                 pc_name: response.data.pc_name || `PC-${port}`,
    //                 mac_address: response.data.mac_address,
    //                 specs: response.data.specs || { ram: null, gpu: null, cpu: null },
    //                 client_version: response.data.version,
    //                 discovered_at: new Date(),
    //                 status: response.data.status || 'offline'
    //             };
    //         }

    //         return null;
    //     } catch (error) {
    //         return null;
    //     }
    // }

    // <-------localtesting--------->

    async registerDiscoveredDevice(params: {
        loungeId: string;
        pc_id: string;
        pc_name: string;
        ip_address: string;
        mac_address?: string;
        specs?: { ram?: string; gpu?: string; cpu?: string };
    }) {
        const { loungeId, pc_id, pc_name, ip_address, mac_address, specs } = params;

        // console.log(`📝 Registering discovered device: ${pc_name} (${ip_address})`);

        const existingDevice = await this._deviceRepository.checkDeviceExists(loungeId, pc_id, ip_address);
        if (existingDevice) throw new BadRequestError(`Device already registered: ${existingDevice.pc_id}`);

        // Register the device
        const device = await this._deviceRepository.createDevice(loungeId, {
            pc_id,
            pc_name,
            ip_address,
            mac_address: mac_address || null,
            specs: specs || { ram: null, gpu: null, cpu: null }
        });

        // console.log(`✅ Device registered successfully: ${device.pc_name} (${device.ip_address})`);

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

    async registerMultipleDevices(params: {
        loungeId: string;
        devices: Array<{
            pc_id: string;
            pc_name: string;
            ip_address: string;
            mac_address?: string;
            specs?: { ram?: string; gpu?: string; cpu?: string };
        }>;
    }) {
        const { loungeId, devices } = params;

        if (!Array.isArray(devices) || devices.length === 0) {
            throw new BadRequestError('No devices provided for registration');
        }

        // console.log(`📝 Bulk registering ${devices.length} devices`);

        const registeredDevices = [];
        const errors = [];

        for (const deviceData of devices) {
            try {
                const { pc_id, pc_name, ip_address, mac_address, specs } = deviceData;

                // Check if device already exists
                const existingDevice = await this._deviceRepository.checkDeviceExists(loungeId, pc_id, ip_address);
                if (existingDevice) {
                    errors.push({
                        pc_id,
                        error: 'Device already registered'
                    });
                    continue;
                }

                // Register the device
                const device = await this._deviceRepository.createDevice(loungeId, {
                    pc_id,
                    pc_name,
                    ip_address,
                    mac_address: mac_address || null,
                    specs: specs || { ram: null, gpu: null, cpu: null }
                });

                registeredDevices.push({
                    id: device._id,
                    pc_id: device.pc_id,
                    pc_name: device.pc_name,
                    ip_address: device.ip_address,
                    status: device.status
                });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error:any) {
                errors.push({
                    pc_id: deviceData.pc_id,
                    error: error.message
                });
            }
        }

        // console.log(`✅ Bulk registration complete: ${registeredDevices.length} successful, ${errors.length} errors`);

        return {
            registered_devices: registeredDevices,
            errors: errors,
            summary: {
                total_attempted: devices.length,
                successful: registeredDevices.length,
                failed: errors.length
            }
        };
    }

    private async scanSingleDevice(ip: string, timeout: number = 2000): Promise<IDiscoveredDevice | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await axios.get(`http://${ip}:3001/client-info`, {
                timeout: timeout,
                signal: controller.signal,
                validateStatus: (status) => status === 200
            });

            clearTimeout(timeoutId);

            // Validate response has required fields
            const data = response.data;
            if (data && data.service === 'gaming-lounge-client' && data.pc_id) {
                return {
                    ip_address: ip,
                    pc_id: data.pc_id,
                    pc_name: data.pc_name || 'Unknown PC',
                    mac_address: data.mac_address || '',
                    specs: data.specs || { ram: '', gpu: '', cpu: '' },
                    status: data.status || 'ready',
                    discovered_at: new Date(),
                    service: data.service
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }


    // private async scanSingleDevice(ip: string, timeout: number = 2000): Promise<IDiscoveredDevice | null> {
    // try {
    //     // FOR TESTING: Map specific IPs to localhost ports
    //     const testMapping: Record<string, string> = {
    //         '192.168.1.101': 'http://localhost:3001',
    //         '192.168.1.102': 'http://localhost:3002',
    //         '192.168.1.103': 'http://localhost:3003',
    //         '192.168.1.104': 'http://localhost:3004',
    //         '192.168.1.105': 'http://localhost:3005'
    //     };

    //     const url = testMapping[ip] || `http://${ip}:3001`;

    //     const response = await axios.get(`${url}/client-info`, {
    //         timeout: timeout,
    //         validateStatus: (status) => status === 200
    //     });

    //     const data = response.data;
    //     if (data && data.service === 'gaming-lounge-client' && data.pc_id) {
    //         return {
    //             ip_address: ip, // Keep original IP for database
    //             pc_id: data.pc_id,
    //             pc_name: data.pc_name,
    //             mac_address: data.mac_address,
    //             specs: data.specs,
    //             discovered_at: new Date(),
    //             status: data.status,
    //             service: data.service
    //         };
    //     }

    //     return null;
    // } catch (error) {
    //     return null;
    // }

}

export default new NetworkService(
    new SuperUserRepository(),
    new DeviceRepository()
);