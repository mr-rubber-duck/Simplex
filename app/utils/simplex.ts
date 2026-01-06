
export type SimplexStep = {
    tableau: number[][];
    enteringVar: number;
    leavingVar: number;
    pivotRow: number;
    pivotCol: number;
    basicVars: number[]; // Indices of variables in the basis for each row
    description: string;
};

export type SimplexResult = {
    steps: SimplexStep[];
    finalTableau: number[][];
    solution: number[];
    optimalValue: number;
    status: 'Optimal' | 'Unbounded' | 'Infeasible';
    variableNames: string[];
    finalBasicVars: number[];
};

export function solveSimplex(
    type: 'max' | 'min',
    numVars: number,
    numConstraints: number,
    objectiveCoeffs: number[],
    constraints: number[][], // Each row: [...coeffs, rhs]
    signs: string[],
    method: 'standard' | 'bigM' | 'twoPhase' = 'standard'
): SimplexResult {
    // Determine M for Big M method
    const M = 100000;

    // 1. Setup Phase & Variables
    // Vars: x1...xn
    // Slacks/Surplus/Artificials depending on sign and method.

    // We need to map variables.
    // Structure: [Decision Vars] [Slack/Surplus] [Artificial] [RHS]

    const decisionVarsCount = numVars;
    let slackSurplusCount = 0;
    let artificialCount = 0;

    // Track indices for each constraint's added variables
    type ConstraintVars = { slack?: number; surplus?: number; artificial?: number };
    const constraintVarsMap: ConstraintVars[] = [];

    // Analyze constraints to count variables
    for (let i = 0; i < numConstraints; i++) {
        const sign = signs[i];
        if (sign === '<=') {
            // Adds +s
            constraintVarsMap.push({ slack: slackSurplusCount++ });
        } else if (sign === '>=') {
            // Adds -s + a
            constraintVarsMap.push({ surplus: slackSurplusCount++, artificial: artificialCount++ });
        } else { // '='
            constraintVarsMap.push({ artificial: artificialCount++ });
        }
    }

    // Adjust counts depending on method (Standard might ignore artificials if forced, but usually fails)
    // If standard selected but we have >=, we technically can't start at origin easily. 
    // We'll proceed assuming the user wants us to try, but real standard simplex doesn't handle >= easily without dual or pre-processing.
    // For this implementation, we'll map 'standard' to use slack/surplus logic but without M (if possible) or just error if infeasible.
    // However, to be helpful, if 'standard' is chosen but infeasibilities exist (>=), we might fallback to Big M logic with warning, 
    // OR we just use Big M variables but M=0? No, that breaks. 
    // Let's implement strict Standard: Only supports <= (Positive RHS).
    // If >= exists, we fall back to logic that adds surplus but no artificial? -> Start infeasible.
    // To strictly follow user request:
    // "Standard": Assume <= constraints. Normalize >= by * -1? 
    // That was my previous fix, but that might make RHS < 0. 
    // Let's perform the "previous fix" logic ONLY if method is 'standard' AND signs contain >=.

    // Actually, for Robustness in this 'Demo' app:
    // Phase 1 (Two Phase) / Big M are best for >=.
    // If method is 'standard' and we see >=, we will convert it to <= which negates RHS.
    // Then we run Primal Simplex. If RHS is negative, we might fail or need Dual. 
    // I will stick to the requested structure.

    const useArtificials = method === 'bigM' || method === 'twoPhase';
    const totalCols = decisionVarsCount + slackSurplusCount + (useArtificials ? artificialCount : 0) + 1; // +1 for RHS

    // Build Variable Names
    const variableNames: string[] = [];
    for (let i = 0; i < numVars; i++) variableNames.push(`x${i + 1}`);
    for (let i = 0; i < slackSurplusCount; i++) variableNames.push(`s${i + 1}`);
    if (useArtificials) {
        for (let i = 0; i < artificialCount; i++) variableNames.push(`a${i + 1}`);
    }

    // Initialize Tableau
    let tableau: number[][] = [];
    const numRows = numConstraints + 1; // +1 for Objective
    for (let i = 0; i < numRows; i++) tableau.push(new Array(totalCols).fill(0));

    // Fill constraints
    const basicVars: number[] = new Array(numConstraints).fill(-1);

    let currentSlackSurplusIndex = decisionVarsCount;
    let currentArtificialIndex = decisionVarsCount + slackSurplusCount;

    for (let i = 0; i < numConstraints; i++) {
        const rowIdx = i + 1;
        const sign = signs[i];

        // Coeffs
        for (let j = 0; j < numVars; j++) {
            tableau[rowIdx][j] = constraints[i][j];
        }
        tableau[rowIdx][totalCols - 1] = constraints[i][numVars]; // RHS

        if (method === 'standard' && sign === '>=') {
            // Normalize for standard: multiply row by -1 to make it <=
            for (let j = 0; j < totalCols; j++) tableau[rowIdx][j] *= -1;
            // Now it's effectively <=, so we add a slack.
            // But wait, our map above reserved a 'surplus'. 
            // Let's just treat it as a slack index for this special "hacky" standard mode.
            tableau[rowIdx][currentSlackSurplusIndex] = 1;
            basicVars[i] = currentSlackSurplusIndex;
            currentSlackSurplusIndex++;
        } else if (sign === '<=') {
            tableau[rowIdx][currentSlackSurplusIndex] = 1;
            basicVars[i] = currentSlackSurplusIndex;
            currentSlackSurplusIndex++;
        } else if (sign === '>=' || sign === '=') {
            if (sign === '>=') {
                tableau[rowIdx][currentSlackSurplusIndex] = -1; // Surplus
                currentSlackSurplusIndex++;
            }
            if (useArtificials) {
                tableau[rowIdx][currentArtificialIndex] = 1; // Artificial
                basicVars[i] = currentArtificialIndex;
                currentArtificialIndex++;
            }
        }
    }

    // Fill Initial Objective Row
    // Max Z: Z - c1x1 - ... = 0
    let c = [...objectiveCoeffs];
    if (type === 'min') {
        c = c.map(v => -v);
    }

    // Set Decision Variable costs in Row 0
    // If Two Phase Phase 1: Objective is Min Sum(Artificials) -> Max -Sum(Artificials)

    const isPhase1 = method === 'twoPhase';

    if (isPhase1) {
        // Phase 1 Obj: Max W = -Sum(ai)
        // W + Sum(ai) = 0
        // Initial tableau Row 0 should be 0 for everything except artificials? 
        // Actually, we express W in terms of non-basics. 
        // W = - (sum of artificial vars).
        // Since ai = RHS - ...
        // We sum rows with artificials and subtract from 0?

        // Simpler approach: Set coeff of ai to 1 in cost row (for Min problem), so -1 for Max W?
        // Let's stick to: Minimize Z_a = a1 + a2... => Max W = -a1 - a2...
        // So W + a1 + a2 = 0.
        // We need to eliminate a1, a2 from Row 0.
        // Start with Row 0 = [0...0, 1 (at a1), 1 (at a2)...] ? No.

        // Standard algebraic setup:
        // Set coeffs for artificials in Z row to 1 (since we minimize sum a_i). 
        // Then subtract rows to make them 0.

        // Let's manually constructing Row 0 from the start:
        // Coeffs of non-artificials = 0.
        // Coeffs of artificials = 1 (to be zeroed out).

        // But for consistency with "Max", let's say we Maximize W' = -Sum(ai).
        // So W' = -a1 - a2... => W' + a1 + a2... = 0.
        // Init row 0: +1 at all artificial cols.
        // Then Step 1: subtract all constraint rows containing artificials from Row 0 to zero out basic vars.

        for (let k = decisionVarsCount + slackSurplusCount; k < totalCols - 1; k++) {
            tableau[0][k] = 1;
        }
    } else if (method === 'bigM') {
        // Obj: Max Z - c*x - M*a
        // Z - c*x + M*a = 0
        // Init Row 0: -c at x, M at a.
        for (let j = 0; j < decisionVarsCount; j++) {
            tableau[0][j] = -c[j];
        }
        for (let k = decisionVarsCount + slackSurplusCount; k < totalCols - 1; k++) {
            tableau[0][k] = M;
        }
    } else {
        // Standard
        for (let j = 0; j < decisionVarsCount; j++) {
            tableau[0][j] = -c[j];
        }
    }

    // Eliminate basic variables from objective row (Canonical form)
    // For Big M and Two Phase, we have non-zeros in objective row corresponding to basic variables (artificials).
    // needed if artificials are basic.
    if (useArtificials) {
        for (let i = 0; i < numConstraints; i++) {
            const basicVar = basicVars[i];
            // If basic variable has a coefficient in Row 0, eliminate it.
            const coeffInObj = tableau[0][basicVar];
            if (coeffInObj !== 0) { // Should be M or 1
                // Row 0 = Row 0 - coeff * Row (i+1)
                for (let j = 0; j < totalCols; j++) {
                    tableau[0][j] -= coeffInObj * tableau[i + 1][j];
                }
            }
        }
    }

    // Solve Routine
    const steps: SimplexStep[] = [];
    const maxIterations = 50;

    // Helper to solve one phase
    function runSimplexLoop(activeTableau: number[][], iterStart: number): number {
        let it = 0;
        let internalTableau = activeTableau; // ref

        while (it < maxIterations) {
            // Find pivot col (most negative in Row 0)
            let pivotCol = -1;
            let minVal = -1e-9; // Tolerance

            for (let j = 0; j < totalCols - 1; j++) {
                if (internalTableau[0][j] < minVal) {
                    minVal = internalTableau[0][j];
                    pivotCol = j;
                }
            }

            if (pivotCol === -1) break; // Optimal for this phase

            // Ratio test
            let pivotRow = -1;
            let minRatio = Infinity;

            for (let i = 1; i <= numConstraints; i++) {
                const rhs = internalTableau[i][totalCols - 1];
                const val = internalTableau[i][pivotCol];
                if (val > 1e-9) {
                    const ratio = rhs / val;
                    if (ratio < minRatio) {
                        minRatio = ratio;
                        pivotRow = i;
                    }
                }
            }

            if (pivotRow === -1) {
                // Unbounded
                return -1;
            }

            // Pivot
            const pivotVal = internalTableau[pivotRow][pivotCol];
            basicVars[pivotRow - 1] = pivotCol;

            steps.push({
                tableau: internalTableau.map(r => [...r]),
                enteringVar: pivotCol,
                leavingVar: pivotRow, // row index
                pivotRow,
                pivotCol,
                basicVars: [...basicVars],
                description: `Iter ${iterStart + it + 1}: Pivot (${pivotRow}, ${pivotCol})`
            });

            // Normalize row
            for (let j = 0; j < totalCols; j++) internalTableau[pivotRow][j] /= pivotVal;

            // Eliminate others
            for (let i = 0; i < numRows; i++) {
                if (i !== pivotRow) {
                    const factor = internalTableau[i][pivotCol];
                    for (let j = 0; j < totalCols; j++) {
                        internalTableau[i][j] -= factor * internalTableau[pivotRow][j];
                    }
                }
            }
            it++;
        }
        return it;
    }

    let iterations = runSimplexLoop(tableau, 0);

    // If Two Phase, start Phase 2
    if (method === 'twoPhase') {
        // Check if Phase 1 successful (W = 0)
        // W is in tableau[0][totalCols-1] (actually -W usually, but checks out close to 0)
        // If optimal value < -epsilon, infeasible.

        const phase1Val = tableau[0][totalCols - 1];
        if (Math.abs(phase1Val) > 1e-5) {
            return {
                steps,
                finalTableau: tableau,
                solution: [],
                optimalValue: 0,
                status: 'Infeasible',
                variableNames,
                finalBasicVars: basicVars
            };
        }

        // Prepare Phase 2
        // Restore original objective function in Row 0
        // Z - c*x = 0
        // Initialize Row 0 with -c for x, 0 for others.
        for (let j = 0; j < totalCols; j++) tableau[0][j] = 0;
        for (let j = 0; j < decisionVarsCount; j++) tableau[0][j] = -c[j];

        // Eliminate basic variables from new objective row
        for (let i = 0; i < numConstraints; i++) {
            const basicVar = basicVars[i];
            // Only if basic var is original or slack/surplus (artificials should be gone or 0)
            // If artificial is still in basis at 0 level explanation is complex, we assume simple case.
            const coeff = tableau[0][basicVar];
            if (Math.abs(coeff) > 1e-9) {
                for (let j = 0; j < totalCols; j++) {
                    tableau[0][j] -= coeff * tableau[i + 1][j];
                }
            }
        }

        // Run Phase 2
        const phase2Steps = runSimplexLoop(tableau, iterations);
        if (phase2Steps === -1) {
            return {
                steps,
                finalTableau: tableau,
                solution: [],
                optimalValue: 0,
                status: 'Unbounded',
                variableNames,
                finalBasicVars: basicVars
            };
        }
    } else if (iterations === -1) {
        return {
            steps,
            finalTableau: tableau,
            solution: [],
            optimalValue: 0,
            status: 'Unbounded',
            variableNames,
            finalBasicVars: basicVars
        };
    }

    // Extract Solution
    const solution = new Array(numVars).fill(0);
    for (let i = 0; i < numConstraints; i++) {
        const bs = basicVars[i];
        if (bs < numVars) {
            solution[bs] = tableau[i + 1][totalCols - 1];
        }
    }

    let optimalValue = tableau[0][totalCols - 1];
    if (type === 'min') optimalValue = -optimalValue; // Convert back if min

    return {
        steps,
        finalTableau: tableau,
        solution,
        optimalValue,
        status: 'Optimal',
        variableNames,
        finalBasicVars: basicVars
    };
}
