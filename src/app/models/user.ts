

export interface User {
    name: string;
    language: string;
    id: string;
    bio: string;
    version: number;

    [key: string]: any;
}