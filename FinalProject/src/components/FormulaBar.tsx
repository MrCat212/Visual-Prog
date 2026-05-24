type FormulaBarProps = {
  value: string;
};

function FormulaBar({ value }: FormulaBarProps) {
  return (
    <div className="formula-bar">
      <span className="formula-label">fx</span>
      <input className="formula-input" value={value} readOnly />
    </div>
  );
}

export default FormulaBar;
