export interface FileMetadataDto {
    name : string;
    description : string;
    getUrl: string;
    postUrl: string;
}

export interface PlaceholderDto {
    key : string;
    value : string;
}

export interface Placeholder {
    key : string;
    value : string;
    savedRemotely : boolean;
}

export interface ActivityDto {
    name: string;
    room: string;
    description: string;
}

export interface Activity 
    extends ActivityDto {
        savedRemotely: boolean;
    }


