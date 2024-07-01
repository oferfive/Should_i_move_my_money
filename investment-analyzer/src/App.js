import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IsraeliInvestmentAnalyzer = () => {
  const [deposits, setDeposits] = useState([{ year: '', amount: '' }]);
  const [currentValue, setCurrentValue] = useState('');
  const [currentCommission, setCurrentCommission] = useState('');
  const [newYield, setNewYield] = useState('');
  const [newCommission, setNewCommission] = useState('');
  const [newTransactionFee, setNewTransactionFee] = useState('');
  const [yearsToProject, setYearsToProject] = useState('');
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  
  const taxRate = 0.25;
  const cpiData = {
    2015: 100.0, 2016: 100.0, 2017: 100.2, 2018: 101.0, 2019: 101.9,
    2020: 101.3, 2021: 102.8, 2022: 107.3, 2023: 111.8, 2024: 113.8
  };

  const calculateCurrentYield = (deposits, currentValue) => {
    const totalDeposited = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
    const years = Math.max(...deposits.map(d => d.year)) - Math.min(...deposits.map(d => d.year)) + 1;
    
    const overallYield = (currentValue - totalDeposited) / totalDeposited;
    const annualYield = (1 + overallYield) ** (1 / years) - 1;
  
    return annualYield;
  };
  
  const handleAddDeposit = () => {
    setDeposits([...deposits, { year: '', amount: '' }]);
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

  const validateInputs = () => {
    const newErrors = {};

    if (deposits.some(d => !d.year || !d.amount)) {
      newErrors.deposits = "All deposit fields must be filled";
    }

    if (!currentValue) newErrors.currentValue = "Current value is required";
    if (!currentCommission) newErrors.currentCommission = "Current commission is required";
    if (!newYield) newErrors.newYield = "New yield is required";
    if (!newCommission) newErrors.newCommission = "New commission is required";
    if (!newTransactionFee) newErrors.newTransactionFee = "New transaction fee is required";
    if (!yearsToProject) newErrors.yearsToProject = "Years to project is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const analyzeInvestment = () => {
    if (!validateInputs()) {
      return; // Stop if there are validation errors
    }
  
    // Convert string inputs to numbers
    const currentValueNum = parseFloat(currentValue);
    const currentCommissionNum = parseFloat(currentCommission) / 100;
    const newYieldNum = parseFloat(newYield) / 100;
    const newCommissionNum = parseFloat(newCommission) / 100;
    const newTransactionFeeNum = parseFloat(newTransactionFee) / 100;
    const yearsToProjectNum = parseInt(yearsToProject);
  
    // Calculate current yield independently
    const currentYieldNum = calculateCurrentYield(deposits, currentValueNum);
  
    // Calculate current investment projection
    const currentProjection = projectInvestment(
      currentValueNum,
      currentYieldNum,
      currentCommissionNum,
      0,
      yearsToProjectNum
    );
  
    // Calculate new investment projection
    const adjustedDeposits = adjustForInflation(deposits);
    const taxAmount = calculateTax(currentValueNum, adjustedDeposits);
    const amountAfterTax = currentValueNum - taxAmount;
    const newProjection = projectInvestment(
      amountAfterTax,
      newYieldNum,
      newCommissionNum,
      newTransactionFeeNum,
      yearsToProjectNum
    );
  
    // Calculate expected real gain and available money for new investment
    const adjustedTotalDeposited = adjustedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const realGain = currentValueNum - adjustedTotalDeposited;
    const availableMoneyForNewInvestment = currentValueNum - taxAmount;
  
    // Find break-even point
    const breakEvenYear = findBreakEvenPoint(currentProjection, newProjection);
  
    // Prepare chart data
    const chartData = currentProjection.map((value, index) => ({
      year: index,
      current: value,
      new: newProjection[index]
    }));
  
    // Set results
    setResults({
      currentFinalValue: currentProjection[yearsToProjectNum],
      newFinalValue: newProjection[yearsToProjectNum],
      breakEvenYear,
      chartData,
      realGain,
      taxAmount,
      availableMoneyForNewInvestment,
      recommendation: newProjection[yearsToProjectNum] > currentProjection[yearsToProjectNum]
        ? "Consider moving to the new investment mechanism."
        : "Stay with the current investment mechanism."
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Should I move my money?</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Deposits</h2>
        {deposits.map((deposit, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="Year"
              value={deposit.year}
              onChange={(e) => handleDepositChange(index, 'year', e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={deposit.amount}
              onChange={(e) => handleDepositChange(index, 'amount', e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <button onClick={() => handleRemoveDeposit(index)}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddDeposit}>Add Deposit</button>
        {errors.deposits && <span style={{ color: 'red', display: 'block' }}>{errors.deposits}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Current Investment</h2>
        <input
          type="number"
          placeholder="Current Value"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        {errors.currentValue && <span style={{ color: 'red', display: 'block' }}>{errors.currentValue}</span>}
        <input
          type="number"
          placeholder="Current Commission (%)"
          value={currentCommission}
          onChange={(e) => setCurrentCommission(e.target.value)}
        />
        {errors.currentCommission && <span style={{ color: 'red', display: 'block' }}>{errors.currentCommission}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>New Investment</h2>
        <input
          type="number"
          placeholder="New Yield (%)"
          value={newYield}
          onChange={(e) => setNewYield(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        {errors.newYield && <span style={{ color: 'red', display: 'block' }}>{errors.newYield}</span>}
        <input
          type="number"
          placeholder="New Commission (%)"
          value={newCommission}
          onChange={(e) => setNewCommission(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        {errors.newCommission && <span style={{ color: 'red', display: 'block' }}>{errors.newCommission}</span>}
        <input
          type="number"
          placeholder="New Transaction Fee (%)"
          value={newTransactionFee}
          onChange={(e) => setNewTransactionFee(e.target.value)}
        />
        {errors.newTransactionFee && <span style={{ color: 'red', display: 'block' }}>{errors.newTransactionFee}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Years to Project"
          value={yearsToProject}
          onChange={(e) => setYearsToProject(e.target.value)}
        />
        {errors.yearsToProject && <span style={{ color: 'red', display: 'block' }}>{errors.yearsToProject}</span>}
      </div>

      <button onClick={analyzeInvestment} style={{ marginBottom: '20px' }}>Analyze</button>

      {results && (
  <div>
    <h2>Results</h2>
    <p>Current Investment Value after {yearsToProject} years: ₪{results.currentFinalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p>New Investment Value after {yearsToProject} years: ₪{results.newFinalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p>Break-even point: {results.breakEvenYear} years</p>
    <p><strong>{results.recommendation}</strong></p>
    
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={results.chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="current" stroke="#8884d8" name="Current Investment" />
        <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Investment" />
      </LineChart>
    </ResponsiveContainer>

    <h3>Additional Information</h3>
    <p>Expected Real Gain: ₪{results.realGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p>Expected Capital Tax to be Paid: ₪{results.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p>Expected Available Money for the New Investment: ₪{results.availableMoneyForNewInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
  </div>
)}
    </div>
  );
};

export default IsraeliInvestmentAnalyzer;