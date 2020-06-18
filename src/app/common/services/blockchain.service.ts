import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Web3Service } from 'src/app/util/web3.service';
import { ContractName } from '../enums/contractName.enum';
import { Contract } from '../interfaces/contract.interface';
import { Subject } from 'rxjs/internal/Subject';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BlockchainService implements OnDestroy {

    private subs = new Subscription();

    private deployedContractsSource = new BehaviorSubject<Map<ContractName, any>>(null);
    public deployedContracts$ = this.deployedContractsSource.asObservable();

    private currentAccountSource = new BehaviorSubject<string>(null);
    public currentAccount$ = this.currentAccountSource.asObservable();

    private web3Source = new BehaviorSubject<any>(null);
    public web3$ = this.web3Source.asObservable();

    private eventsSource = new BehaviorSubject<any>(null);
    public events$ = this.eventsSource.asObservable();

    constructor(private web3Service: Web3Service) {
        console.log('blockchainService')
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