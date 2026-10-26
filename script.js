
// FIVE-STAGE CPU PIPELINE
const stages = ["Fetch", "Decode", "AG", "Execute", "Store"];

let currentCycle = 0;
const totalInstructions = 5;

const nextButton = document.getElementById("nextButton");
const resetButton = document.getElementById("resetButton");
const cycleDisplay = document.getElementById("cycleDisplay");
const pipelineDisplay = document.getElementById("pipelineDisplay");

function displayPipeline() {
    pipelineDisplay.innerHTML = "";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    let header = "<tr><th>Instruction</th>";

    for (let cycle = 1; cycle <= stages.length + totalInstructions - 1; cycle++) {
        header += `<th>C${cycle}</th>`;
    }

    header += "</tr>";
    table.innerHTML = header;

    for (let instruction = 0; instruction < totalInstructions; instruction++) {
        const row = document.createElement("tr");
        let cells = `<td>I${instruction + 1}</td>`;

        for (let cycle = 1; cycle <= stages.length + totalInstructions - 1; cycle++) {
            const stageIndex = cycle - instruction - 1;
            let content = "";

            if (cycle <= currentCycle && stageIndex >= 0 && stageIndex < stages.length) {
                content = stages[stageIndex];
            }

            cells += `<td class="${content ? "active-stage" : "empty-stage"}">${content}</td>`;
        }

        row.innerHTML = cells;
        table.appendChild(row);
    }

    pipelineDisplay.appendChild(table);
}

nextButton.addEventListener("click", function () {
    const maxCycles = stages.length + totalInstructions - 1;

    if (currentCycle < maxCycles) {
        currentCycle++;
    }

    cycleDisplay.textContent = `Current Cycle: ${currentCycle}`;
    displayPipeline();
});

resetButton.addEventListener("click", function () {
    currentCycle = 0;
    cycleDisplay.textContent = "Current Cycle: 0";
    displayPipeline();
});

displayPipeline();


// PERFORMANCE CALCULATOR
const calculateButton = document.getElementById("calculateButton");

calculateButton.addEventListener("click", async function () {
    const instructions = Number(document.getElementById("instructions").value);
    const stageCount = Number(document.getElementById("stagesCount").value);
    const results = document.getElementById("results");

    if (
        !Number.isSafeInteger(instructions) ||
        !Number.isSafeInteger(stageCount) ||
        instructions < 1 ||
        stageCount < 1
    ) {
        results.textContent = "Please enter positive whole numbers.";
        return;
    }

    results.textContent = "Calculating...";

    try {
        const response = await fetch("/api/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instructions,
                stages: stageCount
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Calculation failed.");
        }

        results.innerHTML = `
            <h3>Performance Results</h3>
            <p>Non-pipelined cycles: <strong>${data.nonPipelinedCycles}</strong></p>
            <p>Ideal pipelined cycles: <strong>${data.pipelinedCycles}</strong></p>
            <p>Ideal speedup: <strong>${data.speedup}x</strong></p>
            <p>Theoretical maximum speedup: <strong>${data.maximumSpeedup}x</strong></p>
        `;
    } catch (error) {
        results.textContent = "Error connecting to backend: " + error.message;
    }
});


// DATA HAZARD SIMULATOR
const hazardButton = document.getElementById("hazardButton");
const hazardResults = document.getElementById("hazardResults");
const instruction1Input = document.getElementById("instruction1");
const instruction2Input = document.getElementById("instruction2");

// No default instructions and no automatic filling.
// Users enter both instructions themselves.

hazardButton.addEventListener("click", function () {
    const instruction1 = instruction1Input.value.trim().toUpperCase();
    const instruction2 = instruction2Input.value.trim().toUpperCase();

    if (!instruction1 || !instruction2) {
        hazardResults.textContent = "Please enter both instructions before analyzing.";
        return;
    }

    function parseInstruction(instruction) {
        const parts = instruction.replace(/,/g, " ").trim().split(/\s+/);
        const operations = ["ADD", "SUB", "MUL", "DIV", "AND", "OR", "XOR"];

        if (
            !operations.includes(parts[0]) ||
            parts.length !== 4 ||
            !parts.slice(1).every(register => /^R\d+$/.test(register))
        ) {
            return null;
        }

        return {
            operation: parts[0],
            destination: parts[1],
            sources: parts.slice(2)
        };
    }

    const first = parseInstruction(instruction1);
    const second = parseInstruction(instruction2);

    if (!first || !second) {
        hazardResults.innerHTML = `
            <h3>Invalid Instruction Format</h3>
            <p>Use this format: ADD R1, R2, R3</p>
            <p>Supported operations: ADD, SUB, MUL, DIV, AND, OR, XOR.</p>
            <p>Enter a destination register followed by two source registers.</p>
        `;
        return;
    }

    // RAW hazard: the second instruction reads a register
    // written by the first instruction.
    const hasHazard = second.sources.includes(first.destination);
    const stalls = hasHazard ? 2 : 0;
    const totalCycles = 6 + stalls;
    const speedup = (10 / totalCycles).toFixed(2);

    let secondSchedule;

    if (hasHazard) {
        secondSchedule = `
            <td>C2: Fetch</td>
            <td>C3: Decode</td>
            <td>C4: STALL</td>
            <td>C5: STALL</td>
            <td>C6: AG</td>
            <td>C7: Execute</td>
            <td>C8: Store</td>
        `;
    } else {
        secondSchedule = `
            <td>C2: Fetch</td>
            <td>C3: Decode</td>
            <td>C4: AG</td>
            <td>C5: Execute</td>
            <td>C6: Store</td>
        `;
    }

    hazardResults.innerHTML = `
        <h3>Hazard Analysis Results</h3>

        <p><strong>
            ${hasHazard
                ? "RAW data hazard detected!"
                : "No RAW data hazard detected."}
        </strong></p>

        <p>Instruction 1 writes to ${first.destination}.</p>
        <p>Instruction 2 reads ${second.sources.join(" and ")}.</p>

        <p>
            ${hasHazard
                ? "The instructions are dependent. Two stall cycles are assumed."
                : "The instructions are independent, so no RAW stalls are needed."}
        </p>

        <h3>Pipeline Performance</h3>
        <p>Assumed stall cycles: <strong>${stalls}</strong></p>
        <p>Total cycles for these two instructions: <strong>${totalCycles}</strong></p>
        <p>Illustrative speedup: <strong>${speedup}x</strong></p>

        <h3>Pipeline Schedule for Instruction 2</h3>
        <div style="overflow-x:auto">
            <table>
                <tr>${secondSchedule}</tr>
            </table>
        </div>

        <p><small>
            Assumptions: five stages, no forwarding, and two stall cycles
            for a RAW dependency. The speedup is illustrative, not a
            complete processor performance simulation.
        </small></p>
    `;
});


// CONTROL HAZARD SIMULATOR
const branchButton = document.getElementById("branchButton");
const branchScenario = document.getElementById("branchScenario");
const branchResults = document.getElementById("branchResults");

branchButton.addEventListener("click", function () {
    const branchTaken = branchScenario.value === "taken";

    if (branchTaken) {
        branchResults.innerHTML = `
            <h3>Branch Taken</h3>
            <p>The branch changes the normal instruction flow.</p>
            <p>Instructions fetched from the wrong path may need to be flushed.</p>
            <p><strong>Illustrative penalty: 2 cycles</strong></p>
            <p>Possible solutions include branch prediction or earlier branch resolution.</p>
        `;
    } else {
        branchResults.innerHTML = `
            <h3>Branch Not Taken</h3>
            <p>Execution continues along the normal instruction path.</p>
            <p>No wrong-path instructions need to be flushed in this simplified example.</p>
            <p><strong>Illustrative penalty: 0 cycles</strong></p>
        `;
    }
});


// STRUCTURAL HAZARD SIMULATOR
const resourceButton = document.getElementById("resourceButton");
const resourceScenario = document.getElementById("resourceScenario");
const resourceResults = document.getElementById("resourceResults");

resourceButton.addEventListener("click", function () {
    if (resourceScenario.value === "shared") {
        resourceResults.innerHTML = `
            <h3>Potential Structural Hazard</h3>
            <p>Instruction fetching and data-memory access may require
            the same memory resource in the same cycle.</p>
            <p><strong>Possible result:</strong> one operation must wait.</p>
            <p><strong>Possible solution:</strong> use separate instruction
            and data memories or separate caches.</p>
        `;
    } else {
        resourceResults.innerHTML = `
            <h3>No Memory Conflict in This Example</h3>
            <p>Instruction fetching and data-memory access use separate resources.</p>
            <p>This avoids this particular memory structural hazard.
            Other resource conflicts may still occur.</p>
        `;
    }
});


// MY EXAMPLE: PIPELINE COMPARISON
const compareButton = document.getElementById("compareButton");

compareButton.addEventListener("click", function () {
    const count = Number(document.getElementById("compareInstructions").value);
    const output = document.getElementById("compareResults");
    const stageCount = stages.length;

    if (!Number.isSafeInteger(count) || count < 1) {
        output.textContent = "Enter a positive whole number.";
        return;
    }

    const nonPipelinedCycles = count * stageCount;
    const pipelinedCycles = count + stageCount - 1;
    const speedup = (nonPipelinedCycles / pipelinedCycles).toFixed(2);

    output.innerHTML = `
        <h3>Comparison Results</h3>
        <p>Instructions: <strong>${count}</strong></p>
        <p>Non-pipelined cycles: <strong>${nonPipelinedCycles}</strong></p>
        <p>Ideal pipelined cycles: <strong>${pipelinedCycles}</strong></p>
        <p>Ideal speedup: <strong>${speedup}x</strong></p>
        <p>Assumption: five stages with no stalls or delays.</p>
    `;
});


// MY EXPERIMENT
const experimentButton = document.getElementById("experimentButton");
const saveObservationButton = document.getElementById("saveObservationButton");
const experimentResults = document.getElementById("experimentResults");
const observationList = document.getElementById("observationList");
const experimentNotes = document.getElementById("experimentNotes");

let observations = [];

experimentButton.addEventListener("click", function () {
    const count = Number(document.getElementById("experimentInstructions").value);

    if (!Number.isSafeInteger(count) || count < 1) {
        experimentResults.textContent = "Enter a positive whole number.";
        return;
    }

    const nonPipelinedCycles = count * stages.length;
    const pipelinedCycles = count + stages.length - 1;
    const speedup = (nonPipelinedCycles / pipelinedCycles).toFixed(2);

    experimentResults.innerHTML = `
        <h3>Experiment Results</h3>
        <p>Number of instructions: <strong>${count}</strong></p>
        <p>Non-pipelined cycles: <strong>${nonPipelinedCycles}</strong></p>
        <p>Ideal pipelined cycles: <strong>${pipelinedCycles}</strong></p>
        <p>Ideal speedup: <strong>${speedup}x</strong></p>
    `;
});

saveObservationButton.addEventListener("click", function () {
    const note = experimentNotes.value.trim();

    if (!note) {
        observationList.textContent = "Please write your observation first.";
        return;
    }

    observations.push(note);

    observationList.innerHTML = `
        <h3>My Observations</h3>
        <ul>
            ${observations.map(item => `<li>${escapeHTML(item)}</li>`).join("")}
        </ul>
    `;

    experimentNotes.value = "";
});

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// MY PIPELINE TIMING DIAGRAM
const timingButton = document.getElementById("timingButton");

timingButton.addEventListener("click", function () {
    const count = Number(document.getElementById("timingInstructions").value);
    const output = document.getElementById("timingResults");

    if (!Number.isSafeInteger(count) || count < 1) {
        output.textContent = "Enter a positive whole number.";
        return;
    }

    // Prevent accidentally freezing the browser with an enormous table.
    if (count > 500) {
        output.textContent =
            "Please use 500 instructions or fewer to keep the diagram responsive.";
        return;
    }

    const totalCycles = count + stages.length - 1;

    let tableHTML = `
        <div style="overflow-x:auto">
            <table>
                <tr><th>Instruction</th>
    `;

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
        tableHTML += `<th>C${cycle}</th>`;
    }

    tableHTML += "</tr>";

    for (let instruction = 0; instruction < count; instruction++) {
        tableHTML += `<tr><td>I${instruction + 1}</td>`;

        for (let cycle = 1; cycle <= totalCycles; cycle++) {
            const stageIndex = cycle - instruction - 1;
            const stageName = stages[stageIndex] || "";

            tableHTML += `
                <td class="${stageName ? "active-stage" : "empty-stage"}">
                    ${stageName}
                </td>
            `;
        }

        tableHTML += "</tr>";
    }

    tableHTML += "</table></div>";
    tableHTML += `<p>Total ideal cycles: <strong>${totalCycles}</strong></p>`;

    output.innerHTML = tableHTML;
});


// THEME SELECTOR
const themeSelect = document.getElementById("themeSelect");

if (themeSelect) {
    themeSelect.addEventListener("change", function () {
        const selectedTheme = themeSelect.value;

        if (selectedTheme === "blue") {
            document.body.removeAttribute("data-theme");
        } else {
            document.body.setAttribute("data-theme", selectedTheme);
        }
    });
}
