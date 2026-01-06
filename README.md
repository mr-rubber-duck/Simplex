# Simplex Solver

A modern, interactive web application for solving Linear Programming problems using the Simplex algorithm. Built with Next.js, TypeScript, and Tailwind CSS.

<img width="1366" height="606" alt="01" src="https://github.com/user-attachments/assets/e66d7316-f157-484d-86f9-3083dbb9424f" />


## Real-World Impact

This Simplex Solver has established itself as a valuable educational and analytical tool within the university ecosystem:
- **Academic Adoption**: Utilized by both **professors and students** as a primary resource for teaching Operational Research and learning the mechanics of the Simplex algorithm.
- **Active Userbase**: Successfully supports **over 100 users** at the university, helping them visualize and solve complex linear optimization problems efficiently.


<img width="1335" height="600" alt="02" src="https://github.com/user-attachments/assets/8486897d-88fc-4983-ad8a-5e3e765be9d3" />


## Features

- **Multiple Solving Methods**:
  - **Standard Simplex**: For standard maximization problems with inequalities.
  - **Big M Method**: Handles artificial variables for constraints with `≥` or `=`.
  - **Two-Phase Method**: Robust constraint handling to find initial feasible solutions.
- **Interactive Configuration**:
  - Choose between **Maximization** and **Minimization**.
  - Dynamically set the number of **Variables** and **Constraints**.
  - Toggle constraint inequalities (`≤`, `≥`, `=` support typically handled by Big M/Two-Phase).
- **Detailed Step-by-Step Visualization**:
  - View each iteration of the simplex tableau.
  - See pivot elements (entering and leaving variables).
  - Track the solution status (Optimal, Unbounded, Infeasible).
- **Modern UI/UX**:
  - Clean, dark-mode design.
  - Responsive layout built with Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/simplex-solver.git
    cd simplex-solver
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Open in Browser**:
    Visit [http://localhost:3000](http://localhost:3000) to start solving linear programming problems.

## Usage

1.  **Configuration Step**:
    - Select your optimization goal (**Maximize** or **Minimize**).
    - Choose your solver method (**Standard**, **Big M**, or **Two Phase**).
    - Enter the number of decision variables and constraints.
    - Click **Next Step**.
    
<img width="1366" height="606" alt="01" src="https://github.com/user-attachments/assets/4866fcfe-bc5f-453b-94db-5bd09bb9026d" />


2.  **Define Problem**:
    - Enter the coefficients for the Objective Function ($Z$).
    - Input the coefficients for the constraints.
    - Toggle the inequality signs (`≤`, `≥`, `=`) as needed.
    - Click **Solve Problem**.
<img width="1359" height="608" alt="04" src="https://github.com/user-attachments/assets/72ca53b4-90b6-4acd-8f69-f72b6ad15349" />

    

3.  **View Results**:
    - See the final **Status** (Optimal, Infeasible, Unbounded).
    - Check the **Optimal Value** and the **Solution Vector** ($x_1, x_2, \dots$).
    - Scroll down to view the **Steps Breakdown**, showing every tableau iteration throughout the algorithm.

  <img width="1353" height="601" alt="03" src="https://github.com/user-attachments/assets/1155a029-4f77-4dc8-a094-c2b7b0c38de7" />

## Logic Overview

The core logic resides in `app/utils/simplex.ts`. It implements a tabular Simplex algorithm capable of handling:
- Normalization of minimization problems to maximization.
- Addition of Slack, Surplus, and Artificial variables.
- Pivot operations using the Ratio Test.
- Detection of Unbounded and Infeasible states.

## Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request with your improvements.

## License

This project is licensed under the MIT License.
