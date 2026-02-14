import { useState } from "react";

function RankControls({ onRank }) {
  const [mode, setMode] = useState("top");
  const [topK, setTopK] = useState("");
  const [threshold, setThreshold] = useState("");

  return (
    <div className="rank-controls">
      <div className="radio-options-group">
        
        {/* Option 1 */}
        <label className="rank-mode-label">
          <input 
            type="radio" 
            name="rankMode" 
            checked={mode === "top"} 
            onChange={() => setMode("top")} 
          />
          <span className="mode-selector-chip">Rank by Top List</span>
          <input
            type="number"
            className="rank-input"
            placeholder="e.g. 10"
            disabled={mode !== "top"}
            value={topK}
            onChange={(e) => setTopK(e.target.value)}
          />
        </label>

        {/* Option 2 */}
        <label className="rank-mode-label">
          <input 
            type="radio" 
            name="rankMode" 
            checked={mode === "threshold"} 
            onChange={() => setMode("threshold")} 
          />
          <span className="mode-selector-chip">Rank by Score %</span>
          <input
            type="number"
            className="rank-input"
            placeholder="e.g. 75"
            disabled={mode !== "threshold"}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>

      </div>

      <button className="primary-btn" onClick={() => onRank({ topK, threshold })}>
        Apply Ranking
      </button>
    </div>
  );
}

export default RankControls;