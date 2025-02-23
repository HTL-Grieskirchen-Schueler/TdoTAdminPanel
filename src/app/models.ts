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
