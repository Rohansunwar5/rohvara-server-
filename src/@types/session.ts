export interface Session {
    _id?: string;
    venueId: string;
    pcId: string;
    playerId?: string;
    userName?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    actualDuration?: number;
    amount: number;
    status: SessionStatus;
    gameData?: GameData;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum SessionStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    PAUSED = 'paused'
}

export interface GameData {
    launched: string[];
    performance: {
        cpu: number;
        ram: number;
        gpu: number;
    }
}