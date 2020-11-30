import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Web3Service } from 'src/app/util/web3.service';
import { ContractName } from '../enums/contractName.enum';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BlockchainService implements OnDestroy {

    private subs = new Subscription();

    private deployedContractsSource = new BehaviorSubject<Map<ContractName, any>>(null);
    private currentAccountSource = new BehaviorSubject<string>(null);
    private web3Source = new BehaviorSubject<any>(null);

    public readonly deployedContracts$ = this.deployedContractsSource.asObservable();
    public readonly currentAccount$ = this.currentAccountSource.asObservable();
    public readonly web3$ = this.web3Source.asObservable();


    constructor(private web3Service: Web3Service) {
        this.listenToWeb3();
        this.listenToDeployedContracts();
        this.listenToCurrentAccountAddress();
    }

    private listenToWeb3() {
        this.web3Service.web3$.subscribe((web3: any) => {
            this.web3Source.next(web3);
        });
    }

    private listenToDeployedContracts(): void {
        this.web3Service.deployedContracts$.subscribe((deployedContracts: Map<ContractName, any>) => {
            this.deployedContractsSource.next(deployedContracts);
        });
    }

    private listenToCurrentAccountAddress(): void {
        this.web3Service.currentAccount$.subscribe((currentAccount: string) => {
            this.currentAccountSource.next(currentAccount);
        });
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
        console.log('blockchain destroy');
    }


}