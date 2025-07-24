export interface Venue {
    _id?: string;
    name: string;
    address: string;
    lanServerKey: string;
    contactInfo: {
        phone: string;
        email: string;
    };
    settings: VenueSettings;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface VenueSettings {
    hourlyRate: number;
    currency: string;
    timezone: string;
    operatingHours: {
        open: string;
        close: string;
    };
    maxSessionDuration: number;
}