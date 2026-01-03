
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
    constraints: number[][] // Each row: [...coeffs, rhs]
): SimplexResult {
    // 1. Convert to Standard Form (Maximization)
    // If Min Z, Maximize W = -Z
    let c = [...objectiveCoeffs];
    if (type === 'min') {
        c = c.map((val) => -val);
    }

    // Number of columns: non-basic vars + slack vars + RHS
    // We put RHS in the last column.
    // Tableau structure:
    // Row 0: Objective function (Z - c1x1 - ... = 0) => [-c1, -c2, ..., 0, ..., 0]
    // Row 1..m: Constraints

    const m = numConstraints;
    const n = numVars;
    const totalCols = n + m + 1; // vars + slacks + RHS
    const tableau: number[][] = [];

    // Initialize Objective Row
    // Z - (c1 x1 + ... + cn xn) = 0
    // So coeffs are -c1, -c2...
    const objRow = new Array(totalCols).fill(0);
    for (let i = 0; i < n; i++) {
        objRow[i] = -c[i];
    }
    tableau.push(objRow);

    // Initialize Constraint Rows with Slack Variables
    // Basic variables for rows 1..m start as the slack variables (indices n to n+m-1)
    const basicVars: number[] = []; // basicVars[i] corresponds to row i+1

    for (let i = 0; i < m; i++) {
        const constraintRow = new Array(totalCols).fill(0);
        // Copy coefficients
        for (let j = 0; j < n; j++) {
            constraintRow[j] = constraints[i][j];
        }
        // Set slack variable (identity matrix part)
        constraintRow[n + i] = 1;
        // Set RHS
        constraintRow[totalCols - 1] = constraints[i][n];

        tableau.push(constraintRow);
        basicVars.push(n + i);
    }

    const steps: SimplexStep[] = [];
    const maxIterations = 100;
    let iter = 0;

    // Generate variable names
    const variableNames: string[] = [];
    for (let i = 0; i < n; i++) variableNames.push(`x${i + 1}`);
    for (let i = 0; i < m; i++) variableNames.push(`s${i + 1}`);

    while (iter < maxIterations) {
        // 2. Check for Optimality
        // Look for negative values in the objective row (top row, excluding RHS)
        // If all non-negative, we are optimal.
        let pivotCol = -1;
        let minValue = 0;

        for (let j = 0; j < totalCols - 1; j++) {
            if (tableau[0][j] < minValue) {
                minValue = tableau[0][j];
                pivotCol = j;
            }
        }

        if (pivotCol === -1) {
            // Optimal
            break;
        }

        // 3. Ratio Test for Leaving Variable
        let pivotRow = -1;
        let minRatio = Infinity;

        for (let i = 1; i <= m; i++) {
            const rhs = tableau[i][totalCols - 1];
            const coeff = tableau[i][pivotCol];

            if (coeff > 0) {
                const ratio = rhs / coeff;
                if (ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            }
        }

        if (pivotRow === -1) {
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

        // Record Step
        steps.push({
            tableau: tableau.map(row => [...row]),
            enteringVar: pivotCol,
            leavingVar: pivotRow, // This is the row index, not variable index yet.
            pivotRow,
            pivotCol,
            basicVars: [...basicVars],
            description: `Pivot on row ${pivotRow}, col ${pivotCol} (Enter ${variableNames[pivotCol]}, Leave ${variableNames[basicVars[pivotRow - 1]]})`
        });

        // 4. Pivot Operation
        const pivotElement = tableau[pivotRow][pivotCol];

        // Update leaving variable in basicVars tracker
        basicVars[pivotRow - 1] = pivotCol;

        // Normalize Pivot Row
        for (let j = 0; j < totalCols; j++) {
            tableau[pivotRow][j] /= pivotElement;
        }

        // Eliminate other rows
        for (let i = 0; i <= m; i++) {
            if (i !== pivotRow) {
                const factor = tableau[i][pivotCol];
                for (let j = 0; j < totalCols; j++) {
                    tableau[i][j] -= factor * tableau[pivotRow][j];
                }
            }
        }

        iter++;
    }

    // Extract Solution
    const solution = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
        const varIdx = basicVars[i];
        if (varIdx < n) {
            solution[varIdx] = tableau[i + 1][totalCols - 1];
        }
    }

    let optimalValue = tableau[0][totalCols - 1];

    if (type === 'min') {
        optimalValue = -optimalValue;
    }

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
