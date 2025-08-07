export interface NftMetadata {
    name: string;
    description: string;
    external_url: string;
    attributes: {
        trait_type: string;
        value: string | number;
        display_type?: string;
    }[];
    creator: string;
    properties: {
        [key: string]: any;
    };
}

export interface IpfsUploadResult {
    image: {
        hash: string;
        gateway: string;
    };
    metadata: {
        hash: string;
        gateway: string;
    };
    tokenURI: string;
}

export interface NFTDetails {
    contractAddress: string;
    tokenId: string;
    owner: string;
    transactionHash: string;
    blockNumber: number;
    ipfs: IpfsUploadResult;
    mintedAt: string;
    name: string;
    description: string;
}
