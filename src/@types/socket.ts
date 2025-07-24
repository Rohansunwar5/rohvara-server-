import { DeviceSpecs, DeviceStatus } from "./device";

export interface ClientData {
    pcId: string;
    venueId: string;
    hostname: string;
    ip: string;
    specs: DeviceSpecs;
    status: DeviceStatus;
    lastSeen: Date;
}

export interface SocketCommand {
    type: CommandType;
    payload?: any;
    timestamp?: Date;
}

export enum CommandType {
  LOCK_SCREEN = 'lock_screen',
  UNLOCK_SCREEN = 'unlock_screen',
  START_SESSION = 'start_session',
  END_SESSION = 'end_session',
  PAUSE_SESSION = 'pause_session',
  RESUME_SESSION = 'resume_session',
  RESTART_PC = 'restart_pc',
  SHUTDOWN_PC = 'shutdown_pc',
  LAUNCH_GAME = 'launch_game',
  KILL_PROCESS = 'kill_process',
  STATUS_UPDATE = 'status_update'
}

export interface SessionCommand {
  sessionId: string;
  duration: number;
  userName?: string;
  gamePermissions?: string[];
}