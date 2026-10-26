
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

module.exports = app;
