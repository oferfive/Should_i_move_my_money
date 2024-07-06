
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';  // Ensure this line is at the top

const IsraeliInvestmentAnalyzer = () => {
  const [deposits, setDeposits] = useState([{ year: '', amount: '' }]);
  const [currentValue, setCurrentValue] = useState('');
  const [currentCommission, setCurrentCommission] = useState('');
  const [currentInvestmentResults, setCurrentInvestmentResults] = useState(null);

  const [newYield, setNewYield] = useState('');
  const [newCommission, setNewCommission] = useState('');
  const [newTransactionFee, setNewTransactionFee] = useState('');
  const [yearsToProject, setYearsToProject] = useState('');
  const [comparisonResults, setComparisonResults] = useState(null);

  const [partialInvestmentPercentage, setPartialInvestmentPercentage] = useState('100');

  const [errors, setErrors] = useState({});

  const taxRate = 0.25;
  const cpiData = {
    2015: 100.0, 2016: 100.0, 2017: 100.2, 2018: 101.0, 2019: 101.9,
    2020: 101.3, 2021: 102.8, 2022: 107.3, 2023: 111.8, 2024: 113.8
  };

  const handleAddDeposit = () => {
    setDeposits([...deposits, { year: '', amount: '' }]);
  };

  const validateCurrentInvestmentInputs = () => {
    const newErrors = {};
  
    if (deposits.some(d => !d.year || !d.amount)) {
      newErrors.deposits = "All deposit fields must be filled";
    }
  
    if (!currentValue) newErrors.currentValue = "Current value is required";
    if (!currentCommission) newErrors.currentCommission = "Current commission is required";
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateNewInvestmentInputs = () => {
    const newErrors = {};
  
    if (!newYield) newErrors.newYield = "New yield is required";
    if (!newCommission) newErrors.newCommission = "New commission is required";
    if (!newTransactionFee) newErrors.newTransactionFee = "New transaction fee is required";
    if (!yearsToProject) newErrors.yearsToProject = "Years to project is required";
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleDepositChange = (index, field, value) => {
    const newDeposits = [...deposits];
    newDeposits[index][field] = value;
    setDeposits(newDeposits);
  };

  const handleRemoveDeposit = (index) => {
    const newDeposits = deposits.filter((_, i) => i !== index);
    setDeposits(newDeposits);
  };

  const getLatestCPI = () => {
    return cpiData[Math.max(...Object.keys(cpiData).map(Number))];
  };

  const adjustForInflation = (deposits) => {
    const latestCPI = getLatestCPI();
    return deposits.map(deposit => ({
      year: parseInt(deposit.year),
      amount: parseFloat(deposit.amount) * (latestCPI / cpiData[deposit.year])
    }));
  };

  const calculateTax = (currentValue, adjustedDeposits) => {
    const adjustedTotalDeposited = adjustedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const realGain = currentValue - adjustedTotalDeposited;
    return realGain > 0 ? realGain * taxRate : 0;
  };

  const calculateCurrentYield = (deposits, currentValue) => {
    const totalDeposited = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
  
    // Find the first year with deposits
    const years = deposits.map(d => parseInt(d.year));
    const firstYear = Math.min(...years);
  
    // Use the actual current year
    const currentYear = new Date().getFullYear();
    const investmentDuration = currentYear - firstYear + 1;
    
    const overallYield = (currentValue - totalDeposited) / totalDeposited;
    const annualYield = (1 + overallYield) ** (1 / investmentDuration) - 1;
  
    return annualYield;
  };

  const projectInvestment = (startValue, yieldRate, commissionRate, transactionFee, years) => {
    let value = startValue * (1 - transactionFee);
    const values = [value];
    for (let i = 1; i <= years; i++) {
      value *= (1 + yieldRate) * (1 - commissionRate);
      values.push(value);
    }
    return values;
  };

  const findBreakEvenPoint = (currentValues, newValues) => {
    for (let i = 0; i < currentValues.length; i++) {
      if (newValues[i] > currentValues[i]) return i;
    }
    return "Never";
  };

  const calculateCurrentInvestment = () => {
    if (!validateCurrentInvestmentInputs()) {
      return; // Stop if there are validation errors
    }
  
    const currentValueNum = parseFloat(currentValue);
    const currentYieldNum = calculateCurrentYield(deposits, currentValueNum);
  
    const adjustedDeposits = adjustForInflation(deposits);
    const adjustedTotalDeposited = adjustedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const realGain = currentValueNum - adjustedTotalDeposited;
    const taxAmount = calculateTax(currentValueNum, adjustedDeposits);
    const availableMoneyForNewInvestment = currentValueNum - taxAmount;
  
    setCurrentInvestmentResults({
      currentYieldNum,
      realGain,
      taxAmount,
      availableMoneyForNewInvestment,
    });
  
    setErrors({});
  };
  
  const compareNewInvestment = () => {
    // Validate new investment inputs
    if (!validateNewInvestmentInputs()) {
      return; // Stop if there are validation errors
    }

    if (!currentInvestmentResults) {
      setErrors({ currentInvestment: "Please calculate the current investment performance first." });
      return;
    }

    // Convert string inputs to numbers
    const newYieldNum = parseFloat(newYield) / 100;
    const newCommissionNum = parseFloat(newCommission) / 100;
    const newTransactionFeeNum = parseFloat(newTransactionFee) / 100;
    const yearsToProjectNum = parseInt(yearsToProject);
    const partialPercentage = parseFloat(partialInvestmentPercentage) / 100;

    // Calculate the partial investment amount
    const partialInvestmentAmount = currentInvestmentResults.availableMoneyForNewInvestment * partialPercentage;
    const remainingInvestmentAmount = currentInvestmentResults.availableMoneyForNewInvestment * (1 - partialPercentage);

    // Calculate new investment projection for the partial amount
    const newProjection = projectInvestment(
      partialInvestmentAmount,
      newYieldNum,
      newCommissionNum,
      newTransactionFeeNum,
      yearsToProjectNum
    );

    // Calculate current investment projection for the remaining amount
    const remainingProjection = projectInvestment(
      remainingInvestmentAmount,
      currentInvestmentResults.currentYieldNum,
      parseFloat(currentCommission) / 100,
      0,
      yearsToProjectNum
    );

    // Combine the two projections
    const combinedNewProjection = newProjection.map((value, index) => value + remainingProjection[index]);

    // Calculate current investment projection for comparison
    const currentProjection = projectInvestment(
      parseFloat(currentValue),
      currentInvestmentResults.currentYieldNum,
      parseFloat(currentCommission) / 100,
      0,
      yearsToProjectNum
    );

    const breakEvenYear = findBreakEvenPoint(currentProjection, combinedNewProjection);

    const chartData = currentProjection.map((value, index) => ({
      year: index,
      current: value,
      new: combinedNewProjection[index]
    }));

    setComparisonResults({
      currentFinalValue: currentProjection[yearsToProjectNum],
      newFinalValue: combinedNewProjection[yearsToProjectNum],
      breakEvenYear,
      chartData,
      recommendation: combinedNewProjection[yearsToProjectNum] > currentProjection[yearsToProjectNum]
        ? "Consider moving the specified portion to the new investment mechanism."
        : "Stay with the current investment mechanism."
    });
  };

  const numberFormatter = (value) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="container">
      <h1 className="title">Israeli Investment Analyzer</h1>
      
      <div className="card">
        <h2>Deposits</h2>
        {deposits.map((deposit, index) => (
          <div key={index} className="deposit-row">
            <input
              type="number"
              placeholder="Year"
              value={deposit.year}
              onChange={(e) => handleDepositChange(index, 'year', e.target.value)}
              className="input"
            />
            <input
              type="number"
              placeholder="Amount"
              value={deposit.amount}
              onChange={(e) => handleDepositChange(index, 'amount', e.target.value)}
              className="input"
            />
            <button onClick={() => handleRemoveDeposit(index)} className="button">Remove</button>
          </div>
        ))}
        <button onClick={handleAddDeposit} className="button">Add Deposit</button>
        {errors.deposits && <span className="error">{errors.deposits}</span>}
      </div>
  
      <div className="card">
        <h2>Current Investment</h2>
        <input
          type="number"
          placeholder="Current Value"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          className="input"
        />
        {errors.currentValue && <span className="error">{errors.currentValue}</span>}
        <input
          type="number"
          placeholder="Current Commission (%)"
          value={currentCommission}
          onChange={(e) => setCurrentCommission(e.target.value)}
          className="input"
        />
        {errors.currentCommission && <span className="error">{errors.currentCommission}</span>}
        <button onClick={calculateCurrentInvestment} className="button">Calculate Current Investment</button>
        {errors.currentInvestment && <span className="error">{errors.currentInvestment}</span>}
      </div>
  
      {currentInvestmentResults && (
        <div className="card">
          <h3>Current Investment Results</h3>
          <p>Calculated Annual Yield: {(currentInvestmentResults.currentYieldNum * 100).toFixed(2)}%</p>
          <p>Expected Real Gain: ₪{currentInvestmentResults.realGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Expected Capital Tax to be Paid: ₪{currentInvestmentResults.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Expected Available Money for the New Investment: ₪{currentInvestmentResults.availableMoneyForNewInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      )}
  
      <div className="card">
        <h2>New Investment</h2>
        <input
          type="number"
          placeholder="Percentage to Invest (%)"
          value={partialInvestmentPercentage}
          onChange={(e) => setPartialInvestmentPercentage(e.target.value)}
          className="input"
        />
        <input
          type="number"
          placeholder="New Yield (%)"
          value={newYield}
          onChange={(e) => setNewYield(e.target.value)}
          className="input"
        />
        {errors.newYield && <span className="error">{errors.newYield}</span>}
        <input
          type="number"
          placeholder="New Commission (%)"
          value={newCommission}
          onChange={(e) => setNewCommission(e.target.value)}
          className="input"
        />
        {errors.newCommission && <span className="error">{errors.newCommission}</span>}
        <input
          type="number"
          placeholder="New Transaction Fee (%)"
          value={newTransactionFee}
          onChange={(e) => setNewTransactionFee(e.target.value)}
          className="input"
        />
        {errors.newTransactionFee && <span className="error">{errors.newTransactionFee}</span>}
        <input
          type="number"
          placeholder="Years to Project"
          value={yearsToProject}
          onChange={(e) => setYearsToProject(e.target.value)}
          className="input"
        />
        {errors.yearsToProject && <span className="error">{errors.yearsToProject}</span>}
        <button onClick={compareNewInvestment} className="button">Compare New Investment</button>
      </div>
  
      {comparisonResults && (
        <div className="card">
          <h2>Results</h2>
          <p>Current Investment Value after {yearsToProject} years: ₪{comparisonResults.currentFinalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p>New Investment Value after {yearsToProject} years: ₪{comparisonResults.newFinalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p>Break-even point: {comparisonResults.breakEvenYear} years</p>
          <p><strong>{comparisonResults.recommendation}</strong></p>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparisonResults.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={numberFormatter} />
              <Tooltip formatter={(value) => numberFormatter(value)} />
              <Legend />
              <Line type="monotone" dataKey="current" stroke="#8884d8" name="Current Investment" />
              <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Investment" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default IsraeliInvestmentAnalyzer;