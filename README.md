# Coin Gateway System

This repository contains a coin gateway system that allows interaction with different blockchain networks and crypto currencies. It provides services for creating wallets, validating addresses and transaction hashes, retrieving balances and transactions, and sending coins.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)

## Introduction

The coin gateway system enables seamless integration with different blockchain networks and coins. It supports various operations such as creating wallets, validating addresses and transaction hashes, retrieving balances and transactions, and sending coins.

The system utilizes a modular architecture where each blockchain network and coin has its own service implementation. The provided code includes services for Bitcoin (BTC) and Ethereum (ETH) networks, with support for native coins and ERC20 tokens.

## Prerequisites

Before getting started, ensure that you have the following prerequisites:

- Node.js (version 14 or above)
- npm or yarn package manager
- [NestJS](https://nestjs.com/) (installed globally or as a project dependency)
- A database (e.g., PostgreSQL, MySQL, MongoDB) supported by your NestJS application
- Prisma client set up and connected to your database

## Installation

1. Clone this repository to your local machine:

```bash
git clone https://gitlab.com/SujoyItech/crypto-currency-coin-gateway.git
```
2. Navigate to the project directory:
```bash
cd coin-gateway
```
3. Install the dependencies:
```
yarn install

```
4. Configure your database connection by updating the configuration file: prisma/schema.prisma

5. Run the database migrations to create the necessary tables:
```bash
npm prisma db push or yarn prisma db push
```
6. Configure the necessary environment variables and settings. Refer to the configuration section for more details.

## Usage
To use the cryptocurrency gateway system, follow these steps:
1. Import the necessary modules and classes into your code:
```typescript
import { CoinGatewayService } from './coin_gateway.service';
import { NetworkModel } from '../../../models/db/network.model';
import { CoinModel } from '../../../models/db/coin.model';
import { ResponseModel } from '../../../models/custom/common.response.model';
import { CoinSendParam, FeeEstimationParam, NodeWallet, CoinTxObj } from './coin_gateway.interface';
```
2. Initialize the CoinGatewayService by providing the network and coin details:
```typescript
const network: NetworkModel = /* your network model */;
const coin: CoinModel = /* your coin model */;

const coinGatewayService = new CoinGatewayService();
await coinGatewayService.init(network, coin);

```
3. Use the available methods provided by the CoinGatewayService to interact with the blockchain network and coins. For example:
``` typescript
const wallet: NodeWallet = coinGatewayService.createWallet();
const isValidAddress: boolean = coinGatewayService.validateAddress(address);
const balance: number = await coinGatewayService.getBalance(address);
const transaction: any = await coinGatewayService.getTransaction(txHash, blockNumber);
const coinTxObj: CoinTxObj = await coinGatewayService.sendCoin(data);
const feeEstimation: ResponseModel = await coinGatewayService.estimateFee(data);
const maxFee: number = await coinGatewayService.getMaxFee(data);
```
Refer to the code comments and interface definitions for more details on the available methods and their parameters.

## Configuration
The coin gateway system may require additional configuration depending on the specific blockchain networks and coins you want to support. The provided code assumes that the necessary models and interfaces for network and coin configurations are available.

You may need to update the existing code to match your database schema and configuration requirements. Make sure to review and modify the code to suit your application's needs.

