# Project VotingPower smart contract

[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)

## 1. About

This repository contains the project source code and dependencies required to deploy one Solidity smart contract that meets the following requirements:

- Complies with ERC20 standard
- Supports the following additional APIs:

    - **BalanceOfAt(address, block)** returns the balance of an address for a specific block in the past.

    - **Delegate(address, percentage)** API enables each token holder to delegate a percentage (or all) of his vote power (balance) to 1 - 5 other addresses. Delegation units are percentage. Max 100% of vote power can be delegated.

    - **VotePowerOfAt(Address, block)** returns the vote power of a specific address in a specific block. The vote power includes its own balance and any balance delegated to it by other addresses.

## 2. Project features

- Solidity smart contract deploys ERC20 token **mXRP** (Mock XRP) 
- Test suite implemented in Truffle framework with Mocha and Chai
- Deployment to Ganache local dev network
### (to be implemented)
- Secrets and addresses handled by @truffle/hdwallet-provider
- Deployment to Ropsten test network (via infura.io)

## 4. Framework and dependencies

- Source code language: Solidity
- Development environment: 
    - Node.js & NPM
    - Truffle & Truffle-hdwallet
    - Ganache CLI
    - Chai
    - @Openzeppelin/contracts
- MetaMask Wallet
- Available API project KEY from [infura.io](https://infura.io) on Ropsten endpoint
- Ropsten Ether tokens *holder account* (may be requested via this faucet: <https://faucet.ropsten.network/>)


## 5. Usage

### Installation
```bash
$ git clone https://github.com/alejoacosta74/solidityVotingPower votingPowerProject
$ cd votingPowerProject
$ npm install
$ truffle init
```
### Compile & migrate to local dev
```bash
$ truffle compile
```

On a separate terminal start Ganache-CLI:
```bash
ganache-cli -m "<seed phrase>" -h 0.0.0.0
```
Migrate and deploy to Ganache:
```bash
$ truffle migrate --network development
```
### Run tests
```javascript
$ truffle test --network development  //run test suite against Ganache
```

## 6. Test cases

- Block 5: Bob has 20 tokens (non delegated): vote power 20. Lucy has 10 tokens, non delegated → vote power 10. Ed has no tokens.

- Block 10: bob delegates 50% of voting power to Lucy and 25% to Ed. Now Ed has votePower 5, Lucy has vote power 20, bob has vote power 5.

- Call to API votePowerOfAt(lucy, 9) → 10

- Call to API votePowerOfAt(lucy, 11) → 20

To remove delegated vote power, call delegate(address, percentage) with percentage = 0.


## 7. Test results

Output from ```#truffle test --network development```:
```bash

Contract: Test Suite for VotingPower smart contract

 Describe: Testing -> Basic deployment
      ✓ Contract has a name (41ms)
      ✓ Initial token transfer to Bob
      ✓ Initial token transfer to Lucy
      ✓ Ed balance remains at 0

 Describe: Testing -> Initial Voting Power
      ✓ Bob voting power is equal to the amount of tokens, i.e. 20
      ✓ Lucy voting power is equal to the amount of tokens, i.e. 10 (42ms)
      ✓ Ed voting power is equal to the amount of tokens, i.e. 0

 Describe: Testing -> Delegate function
      ✓ Bob delegates 50% to Lucy (153ms)
      ✓ Bob delegates 25% to Ed (189ms)

 Describe: Testing -> Remove Delegate
      ✓ Bob Removes delegation to Lucy (258ms)
      ✓ Bob removes delegation to Ed (182ms)

Contract: Testsuite for functions BalanceOfAT() and VotePowerOfAt()

 Describe: Testing -> VotePowerOfAt and BalanceOfAt with Lucy

      ✓ On block 9 Lucy has VotingPower = 10 and Balance = 10 (61ms)
      ✓ On block 10 Lucy has VotingPower = 20 (57ms)
      ✓ On block 11 Lucy has VotingPower = 20 (50ms)
      ✓ On block 12 Lucy has VotingPower = 10 (47ms)

 Describe: Testing -> VotePowerOfAt and BalanceOfAt with Bob

      ✓ On block 9 Bob has VotingPower = 20 and Balance = 20 (65ms)
      ✓ On block 10 Bob has VotingPower = 10 and Balance = 20 (53ms)
      ✓ On block 11 Bob has VotingPower = 5 and Balance = 20 (59ms)
      ✓ On block 12 Bob has VotingPower = 15 and Balance = 20 (59ms)
      ✓ On block 13 Bob has VotingPower = 20 and Balance = 20 (63ms)

 Describe: Testing -> VotePowerOfAt and BalanceOfAt with Ed

      ✓ On block 9 Ed has VotingPower = 0 and Balance = 0 (59ms)
      ✓ On block 10 Ed has VotingPower = 0 (51ms)
      ✓ On block 11 Ed has VotingPower = 5 (60ms)
      ✓ On block 12 Ed has VotingPower = 5 (76ms)
      ✓ On block 13 Ed has VotingPower = 0 (68ms)


  25 passing (4s)
```