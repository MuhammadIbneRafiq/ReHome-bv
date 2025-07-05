export type UserData = {
    email: string;
    email_verified: boolean;
    phone_verified: boolean;
    sub: string;
    role?: 'user' | 'admin'; // Optional role field for authorization
    user_metadata?: {
        name?: string;
        [key: string]: any;
    };
};
