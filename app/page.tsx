"use client";

import { useState } from "react";
import { solveSimplex, SimplexResult } from "./utils/simplex";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState({
    type: "max" as "max" | "min",
    numVars: 2,
    numConstraints: 2,
  });

  const [objectiveCoeffs, setObjectiveCoeffs] = useState<string[]>([]);
  const [constraintsCoeffs, setConstraintsCoeffs] = useState<string[][]>([]);
  const [result, setResult] = useState<SimplexResult | null>(null);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Initialize coefficient arrays with empty strings or zeros
    setObjectiveCoeffs(new Array(config.numVars).fill(""));
    const initialConstraints = Array.from({ length: config.numConstraints }, () =>
      new Array(config.numVars + 1).fill("") // +1 for RHS
    );
    setConstraintsCoeffs(initialConstraints);
    setStep(2);
  };

  const handleSolve = () => {
    // Parse inputs
    const obj = objectiveCoeffs.map((v) => parseFloat(v) || 0);
    const cons = constraintsCoeffs.map((row) =>
      row.map((v) => parseFloat(v) || 0)
    );

    const res = solveSimplex(
      config.type,
      config.numVars,
      config.numConstraints,
      obj,
      cons
    );
    setResult(res);
    setStep(3);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Simplex Solver
          </h1>
          <p className="text-neutral-400">
            Linear Programming Optimization Tool
          </p>
        </header>

        {/* Step 1: Configuration */}
        {step === 1 && (
          <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl">
            <form onSubmit={handleConfigSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Optimization Goal
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, type: "max" })}
                    className={`p-3 rounded-lg border transition-all ${config.type === "max"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
                      }`}
                  >
                    Maximize
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, type: "min" })}
                    className={`p-3 rounded-lg border transition-all ${config.type === "min"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
                      }`}
                  >
                    Minimize
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Variables
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.numVars}
                    onChange={(e) =>
                      setConfig({ ...config, numVars: parseInt(e.target.value) })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Constraints
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.numConstraints}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        numConstraints: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Next Step
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Matrix Input */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Define Problem</h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-neutral-400 hover:text-white"
              >
                ← Back
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl overflow-x-auto">
              <h3 className="text-lg font-medium text-indigo-400 mb-4">
                Objective Function (Z)
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-mono">{config.type === 'max' ? 'Max' : 'Min'} Z = </span>
                {objectiveCoeffs.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span>+</span>}
                    <input
                      type="number"
                      placeholder={`c${i + 1}`}
                      value={val}
                      onChange={(e) => {
                        const newCoeffs = [...objectiveCoeffs];
                        newCoeffs[i] = e.target.value;
                        setObjectiveCoeffs(newCoeffs);
                      }}
                      className="w-20 bg-neutral-800 border border-neutral-700 rounded p-2 text-center focus:border-indigo-500 outline-none"
                    />
                    <span className="font-mono text-neutral-400">x{i + 1}</span>
                  </div>
                ))}
              </div>

              <div className="my-8 border-t border-neutral-800" />

              <h3 className="text-lg font-medium text-indigo-400 mb-4">
                Constraints (Subject to)
              </h3>
              <div className="space-y-4">
                {constraintsCoeffs.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    {row.slice(0, config.numVars).map((val, j) => (
                      <div key={j} className="flex items-center gap-2">
                        {j > 0 && <span>+</span>}
                        <input
                          type="number"
                          placeholder={`a${i + 1}${j + 1}`}
                          value={val}
                          onChange={(e) => {
                            const newCons = [...constraintsCoeffs];
                            newCons[i][j] = e.target.value;
                            setConstraintsCoeffs(newCons);
                          }}
                          className="w-20 bg-neutral-800 border border-neutral-700 rounded p-2 text-center focus:border-indigo-500 outline-none"
                        />
                        <span className="font-mono text-neutral-400">
                          x{j + 1}
                        </span>
                      </div>
                    ))}
                    <span className="mx-2">≤</span>
                    <input
                      type="number"
                      placeholder="b"
                      value={row[config.numVars]}
                      onChange={(e) => {
                        const newCons = [...constraintsCoeffs];
                        newCons[i][config.numVars] = e.target.value;
                        setConstraintsCoeffs(newCons);
                      }}
                      className="w-24 bg-neutral-800 border border-neutral-700 rounded p-2 text-center focus:border-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSolve}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
              >
                Solve Problem
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Solution Results</h2>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-neutral-400 hover:text-white"
              >
                ← Edit Input
              </button>
            </div>

            {/* Final Outcome */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl border ${result.status === 'Optimal' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <div className="text-sm uppercase tracking-wider mb-1 opacity-80">Status</div>
                <div className="text-2xl font-bold">{result.status}</div>
              </div>
              <div className="p-6 rounded-xl border bg-neutral-900 border-neutral-800">
                <div className="text-sm uppercase tracking-wider mb-1 text-neutral-400">Optimal Value (Z)</div>
                <div className="text-2xl font-bold text-white">{result.optimalValue.toFixed(4)}</div>
              </div>
              <div className="p-6 rounded-xl border bg-neutral-900 border-neutral-800">
                <div className="text-sm uppercase tracking-wider mb-1 text-neutral-400">Solution Vector</div>
                <div className="text-sm space-y-1">
                  {result.solution.map((val, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-mono text-neutral-500">x{i + 1}: </span>
                      <span className="font-mono text-neutral-200">{val.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps / Tableau */}
            <div className="space-y-8">
              <h3 className="text-xl font-semibold border-l-4 border-indigo-500 pl-4">Steps Breakdown</h3>

              {result.steps.length === 0 && <p className="text-neutral-500 italic">No iterations needed (Initial solution was optimal).</p>}

              {result.steps.map((iter, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="bg-neutral-950/50 p-4 border-b border-neutral-800 flex justify-between items-center">
                    <span className="font-medium text-neutral-300">Iteration {idx + 1}</span>
                    <span className="text-xs text-neutral-500 font-mono bg-neutral-800 px-2 py-1 rounded">
                      {iter.description}
                    </span>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800">Base</th>
                          {result.variableNames.map((name, i) => (
                            <th key={i} className={`p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800 ${i === iter.pivotCol ? 'text-indigo-400 bg-indigo-500/10' : ''}`}>
                              {name}
                            </th>
                          ))}
                          <th className="p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800 text-yellow-500/80">RHS</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-sm">
                        {iter.tableau.map((row, rIdx) => {
                          const isPivotRow = rIdx === iter.pivotRow;
                          return (
                            <tr key={rIdx} className={isPivotRow ? 'bg-indigo-500/5' : ''}>
                              <td className="p-3 border-b border-neutral-800/50 text-neutral-400 text-xs">
                                {rIdx === 0 ? 'Z' : result.variableNames[iter.basicVars[rIdx - 1]]}
                              </td>
                              {row.map((val, cIdx) => {
                                const isPivotCell = isPivotRow && cIdx === iter.pivotCol;
                                return (
                                  <td key={cIdx} className={`p-3 border-b border-neutral-800/50 ${isPivotCell ? 'font-bold text-indigo-400' : 'text-neutral-300'}`}>
                                    {Number.isInteger(val) ? val : val.toFixed(3)}
                                  </td>
                                )
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Final Tableau */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden mt-8">
                <div className="bg-green-900/10 p-4 border-b border-green-900/20 flex justify-between items-center">
                  <span className="font-medium text-green-400">Final Tableau</span>
                  <span className="text-xs text-green-500/70 font-mono uppercase">Optimal</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800">Base</th>
                        {result.variableNames.map((name, i) => (
                          <th key={i} className="p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800">
                            {name}
                          </th>
                        ))}
                        <th className="p-2 text-xs text-neutral-500 uppercase border-b border-neutral-800 text-yellow-500/80">RHS</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {result.finalTableau.map((row, rIdx) => {
                        return (
                          <tr key={rIdx}>
                            <td className="p-3 border-b border-neutral-800/50 text-neutral-400 text-xs text-left">
                              {rIdx === 0 ? 'Z' : result.variableNames[result.finalBasicVars[rIdx - 1]]}
                            </td>
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="p-3 border-b border-neutral-800/50 text-neutral-300">
                                {Number.isInteger(val) ? val : val.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
