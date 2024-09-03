import express from 'express';
import User from '../models/User.js';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAssociatedTokenAddressSync,
    getAccount,
    TokenInvalidAccountOwnerError,
    TokenAccountNotFoundError,
} from '@solana/spl-token';
import { tokens, wallet, MINT, DECIMALS, getTwitterData } from '../utils/helper.js';
import dotenv from 'dotenv';
dotenv.config()
const router = express.Router();
const connection = new Connection(process.env.RPC_URL, 'confirmed');

// get or create user
router.post("/user", async (req, res) => {

    const { address } = req.body;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        let user = await User.findOne({ address });
        if (!user) {
            user = new User({ address });
            await user.save();
        }

        res.status(200).json({ user });

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }
});

// Update airdrop status
router.post('/airdrop', async (req, res) => {
    const { address, airdropped } = req.body;

    if (!address || airdropped === undefined) {
        return res.status(400).json({ error: 'Address and airdropped status are required' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { address },
            { airdropped },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

router.post('/airdropstatus', async (req, res) => {
    try {
        const { address } = req.body;
        const user = await User.findOne({ address });
        res.status(200).json(user.airdropped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/createtransaction', async (req, res) => {
    try {
        const { publicKey, tokensPresent, airdropAmount, toATA } = req.body;
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext();

        const transaction = new Transaction({
            blockhash,
            lastValidBlockHeight,
            feePayer: new PublicKey(publicKey),
        });

        // try {
        //     await getAccount(connection, new PublicKey(toATA));
        // } catch (error) {
        //     if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
        //         const createATAInstruction = createAssociatedTokenAccountInstruction(
        //             new PublicKey(publicKey),
        //             new PublicKey(toATA),
        //             new PublicKey(publicKey),
        //             MINT
        //         );
        //         transaction.add(createATAInstruction);
        //     } else {
        //         throw error;
        //     }
        // }

        // const transferInstruction = createTransferInstruction(
        //     getAssociatedTokenAddressSync(
        //         MINT,
        //         wallet.windows.publicKey
        //     ), // From Token Account
        //     new PublicKey(toATA), // To Token Account
        //     wallet.windows.publicKey, // Token Account owner
        //     airdropAmount * 10 ** DECIMALS // Transfer amount
        // );
        // transaction.add(transferInstruction);

        // transaction.partialSign(wallet.windows);

        const serializedTransaction = transaction.serialize({
            verifySignatures: false,
            requireAllSignatures: false,
        });

        const base64Transaction = serializedTransaction.toString('base64');

        res.status(200).json({
            base64Transaction,
            minContextSlot,
            blockhash,
            lastValidBlockHeight,
            message: "OK",
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/getprice', async (req, res) => {
    try {
        const { token } = req.body;
        const response = await fetch(`https://pro-api.solscan.io/v1.0/market/token/${token}?limit=10&offset=0`, {
            method: 'GET',
            headers: {
                'token': process.env.SOLSCAN_TOKEN,
            },
        });
        const data = await response.json();
        res.status(200).json({ price: data.priceUsdt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gettokenaccounts', async (req, res) => {
    try {
        const { address } = req.body;
        const response = await fetch(`https://pro-api.solscan.io/v1.0/account/splTransfers?account=${address}&fromTime=1704067200&toTime=1725192000&limit=50&offset=0`, {
            method: 'GET',
            headers: {
                'token': process.env.SOLSCAN_TOKEN,
            },
        });
        const transactionData = await response.json();

        // Group transactions by tokenAddress
        const groupedTransactions = transactionData.data.reduce((acc, transaction) => {
            if (acc[transaction.tokenAddress]) {
                acc[transaction.tokenAddress].push(transaction);
            } else {
                acc[transaction.tokenAddress] = [transaction];
            }
            return acc;
        }, {});

        // Find latest transaction for each token type
        const latestTransactions = Object.values(groupedTransactions).flatMap(transactions => {
            const latestTransaction = transactions.reduce((latest, current) => {
                return current.blockTime > latest.blockTime ? current : latest;
            });
            return latestTransaction;
        });

        // Filter and map to match tokens object
        const filteredTransactions = latestTransactions.filter(transaction => Object.values(tokens).includes(transaction.tokenAddress));

        function getTokenKey(value) {
            return Object.keys(tokens).find(key => tokens[key] === value);
        }

        const requiredData = filteredTransactions.reduce((accumulator, transaction) => {
            const key = getTokenKey(transaction.tokenAddress);
            accumulator[key] = parseInt(transaction.postBalance) / (10 ** transaction.decimals);
            return accumulator;
        }, {});
        res.status(200).json(requiredData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gettweet', async (req, res) => {
    try {
        const { username } = req.body;
        const resp = await getTwitterData(username);
        const data = resp.includes.tweets[0].text;
        const regex = /^I am qualified for \d+ \$CATDOGS!\nHolders of MEW, POPCAT, or WIF all qualify for the \$CATDOGS airdrop\.\nCheck eligibility here: https:\/\/.+$/;
        let verified = regex.test(data);
        res.status(200).json({ verified });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;