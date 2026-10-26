
const express = require("express");

const app = express();
const PORT = 3000;

// Allow the server to read JSON data
app.use(express.json());

// Serve our existing frontend files
app.use(express.static(__dirname));

// Backend API for pipeline performance calculation
app.post("/api/calculate", (req, res) => {
    const { instructions, stages } = req.body;

    if (
        !Number.isInteger(instructions) ||
        !Number.isInteger(stages) ||
        instructions < 1 ||
        stages < 1
    ) {
        return res.status(400).json({
            error: "Enter positive whole numbers."
        });
    }

    const nonPipelinedCycles = instructions * stages;
    const pipelinedCycles = instructions + stages - 1;
    const speedup = nonPipelinedCycles / pipelinedCycles;

    res.json({
        instructions,
        stages,
        nonPipelinedCycles,
        pipelinedCycles,
        speedup: Number(speedup.toFixed(2)),
        maximumSpeedup: stages
    });
});

app.listen(PORT, () => {
    console.log(`CPU Pipeline Studio running at http://localhost:${PORT}`);
});
