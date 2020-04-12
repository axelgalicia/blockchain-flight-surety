import { InjectionToken, Component } from '@angular/core';
import Web3 from 'web3';

const ETHEREUM = 'ethereum';

export const WEB3 = new InjectionToken<Web3>('web3', {
    providedIn: 'root',
    factory: () => {
        try {

            const isEthereumInWindows = (ETHEREUM in window);

            const provider = new Web3((isEthereumInWindows) ? window[`'${ETHEREUM}'`] : Web3.givenProvider);

            // Asking for account access (Metamask)
            if (isEthereumInWindows) {
                const ethereum = window[`${ETHEREUM}`];
                enableEthereum(ethereum);
                ethereum.autoRefreshOnNetworkChange = false;
                ethereum.on('chainChanged', networkChanged);
                ethereum.on('accountsChanged', accountsChanged);
            }

            return provider;
        } catch (err) {
            if (err.code === 4001) { // EIP 1193 userRejectedRequest error
                console.log('Please connect to MetaMask.')
            }
            console.log(err);
            const msg = 'No Ethereum provider found. Consider using Metamask or Mist';
            alert(msg);
            throw new Error(msg);
        }
    }
});

const enableEthereum = async (ethereum: any) => {
    try {
        ethereum.send('eth_requestAccounts').then(result => {
                console.log(result);
        });
        // if (!accounts) {
        //     await ethereum.enable();
        // }
    }
    catch (err) {
        if (err.code === 4001) { // EIP 1193 userRejectedRequest error
            console.log('User has rejected to connect to MetaMask.')
            alert('Failed to connect to Metamask!');
            return;
        } else {
            console.log(err);
        }
    }

}

const networkChanged = (obj: any) => {
    console.log('NETWORK CHANGED:', obj);
}

const accountsChanged = (accounts: any) => {
    console.log('Accounts change: ', accounts);
}