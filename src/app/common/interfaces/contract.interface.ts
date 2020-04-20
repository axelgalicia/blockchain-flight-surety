import { ContractName } from "../enums/contractName.enum";

export interface Contract {
    name: ContractName;
    instance: any;
}