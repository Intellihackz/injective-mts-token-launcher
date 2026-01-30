const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());

app.post('/verify', async (req, res) => {
    const { contractAddress, constructorArgs } = req.body;

    if (!contractAddress) {
        return res.status(400).json({ error: 'contractAddress is required' });
    }

    console.log('Verifying contract:', contractAddress);
    console.log('Constructor args:', constructorArgs);

    try {
        const targetNetwork = 'inj_testnet';

        // Direct verification without additional indexing steps
        // Build the command: npx hardhat verify --network <network> <address> <args>
        let command = `npx hardhat verify --network ${targetNetwork} ${contractAddress}`;

        // Add constructor arguments if provided
        if (constructorArgs && constructorArgs.length > 0) {
            const argsString = constructorArgs.map(arg => `"${arg}"`).join(' ');
            command += ` ${argsString} --force`;
        }

        console.log('Executing command:', command);

        // Execute the verification command with longer timeout and larger buffer
        const { stdout, stderr } = await execAsync(command, {
            cwd: __dirname, // Ensure we're in the correct directory
            timeout: 300000, // 5 minutes timeout
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        console.log('stdout:', stdout);
        if (stderr) {
            console.log('stderr:', stderr);
        }

        res.json({
            success: true,
            message: 'Contract verified successfully',
            output: stdout
        });

    } catch (error) {
        console.error('Verification error:', error);

        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stderr || error.stdout
        });
    }
});

app.listen(3001, () => {
    console.log('🚀 Verification server running on http://localhost:3001');
    console.log('📝 POST /verify to verify contracts');
});
