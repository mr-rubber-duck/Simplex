# Simplex Algorithm Implementation Report

This report documents the calculation logic used in the `solveSimplex` function within `app/utils/simplex.ts`. The implementation uses the **Tableau Method** (Standard Simplex) to solve linear programming problems.

## 1. Problem Standardization
Before the algorithm begins, the problem is converted into **Standard Form**:

*   **Minimization to Maximization:** 
    If the user requests a Minimization problem (Min $Z$), the code converts it to Maximization problem by negating the objective function coefficients ($Max W = -Z$).
    
*   **Slack Variables:** 
    The algorithm automatically adds **slack variables** to convert inequality constraints ($\le$) into equality constraints ($=$).
    *   For $m$ constraints, we add $m$ slack variables ($s_1, s_2, ..., s_m$).
    *   This creates an initial **Identity Matrix** within the tableau, providing an initial basic feasible solution.

## 2. Tableau Structure
The Data is stored in a 2D array (matrix) called `tableau`.

*   **Rows:** $m + 1$ rows (1 Objective row + $m$ Constraint rows).
*   **Columns:** $n + m + 1$ columns ($n$ decision variables + $m$ slack variables + 1 RHS column).

### Objective Row (Row 0)
Represents the equation: $Z - c_1x_1 - c_2x_2 ... = 0$.
*   The coefficients from the user are stored as negative values ($-c_i$).
*   The last column (RHS) initially starts at 0.

### Constraint Rows (Rows 1 to m)
Each row represents a constraint: $a_{i1}x_1 + ... + a_{in}x_n + s_i = b_i$.
*   Includes the coefficients for decision variables ($x$).
*   Includes a $1$ for the specific slack variable ($s$) associated with that row.
*   The last column holds the Right Hand Side (RHS) value ($b_i$).

## 3. The Iterative Process (While Loop)
The algorithm iterates until an optimal solution is found or a limit is reached.

### Step A: Optimality Check (Entering Variable)
The code scans the **Objective Row** (Row 0) for negative values.
*   **Logic:** The variable with the most negative coefficient in Row 0 has the largest potential to increase $Z$.
*   **Result:** This column index becomes the **Entering Variable** (Pivot Column).
*   **Stop Condition:** If all values in Row 0 are non-negative ($\ge 0$), the current solution is **Optimal**.

### Step B: Ratio Test (Leaving Variable)
To determine which variable leaves the basis, the code performs the **Minimum Ratio Test**:
*   For every constraint row $i$ (where the coefficient in the pivot column is positive):
    $$ Ratio = \frac{\text{RHS}_i}{\text{PivotColumnValue}_i} $$
*   **Logic:** The row with the smallest non-negative ratio is the "tightest" constraint.
*   **Result:** This row index becomes the **Leaving Variable** (Pivot Row).
*   **Unbounded Check:** If no positive coefficients exist in the pivot column, the solution is **Unbounded**.

### Step C: Pivoting (Gaussian Elimination)
The tableau is transformed to make the pivot element equal to 1 and all other elements in the pivot column equal to 0.

1.  **Normalize Pivot Row:** Divide the entire Pivot Row by the **Pivot Element**.
2.  **Eliminate Other Rows:** For every other row (including the Objective Row), subtract a multiple of the normalized Pivot Row:
    $$ \text{NewRow}_i = \text{OldRow}_i - (\text{Factor} \times \text{PivotRow}) $$

## 4. Extracting Results
Once the loop terminates (Optimality reached):

*   **Solution Vector:** The code scans the `basicVars` array to map the final results.
    *   If a decision variable ($x_i$) is in the basis at Row $k$, its value is the RHS of Row $k$.
    *   Non-basic variables are 0.
*   **Optimal Value (Z):** Taken from the RHS of Row 0.
    *   If the original problem was Minimization, this value is negated back to positive to give the correct Min $Z$.

## Summary of Code Flow
```mermaid
graph TD
    A[Input: Objective & Constraints] --> B{Type == Min?}
    B -- Yes --> C[Negate Objective Coeffs]
    B -- No --> D[Build Initial Tableau]
    C --> D
    D --> E[Check Row 0 for Negatives]
    E -- No Negatives --> F[Optimal Solution Found]
    E -- Found Negatives --> G[Select Pivot Column]
    G --> H[Calculate Ratios (RHS / Col Val)]
    H --> I{Valid Ratios?}
    I -- No --> J[Result: Unbounded]
    I -- Yes --> K[Select Pivot Row (Min Ratio)]
    K --> L[Pivot Operation (Gauss-Jordan)]
    L --> E
```
