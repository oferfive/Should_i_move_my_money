import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";
import { NumericFormat } from 'react-number-format';
import { getCPIValue, cpiData } from './cpiData';

const IsraeliInvestmentAnalyzer = () => {
  const [useMonthlyData, setUseMonthlyData] = useState(false);
  const [deposits, setDeposits] = useState([{ year: "", startMonth: "", endMonth: "", amount: "" }]);
  const [currentValue, setCurrentValue] = useState("");
  const [currentCommission, setCurrentCommission] = useState("");
  const [currentInvestmentResults, setCurrentInvestmentResults] =
    useState(null);

  const [newYield, setNewYield] = useState("");
  const [newCommission, setNewCommission] = useState("");
  const [newTransactionFee, setNewTransactionFee] = useState("");
  const [yearsToProject, setYearsToProject] = useState("");
  const [comparisonResults, setComparisonResults] = useState(null);

  const [partialInvestmentPercentage, setPartialInvestmentPercentage] =
    useState("100");
  const [errors, setErrors] = useState({});

  const [useExistingYield, setUseExistingYield] = useState(true);
  const [manualCurrentYield, setManualCurrentYield] = useState("");

  const taxRate = 0.25;

  const handleAddDeposit = () => {
    setDeposits([...deposits, { year: "", startMonth: "", endMonth: "", amount: "" }]);
  };

  const validateCurrentInvestmentInputs = () => {
    const newErrors = {};

    if (deposits.some((d) => !d.year || !d.amount || (useMonthlyData && (!d.startMonth || !d.endMonth)))) {
      newErrors.deposits = "All deposit fields must be filled";
    }

    if (!currentValue) newErrors.currentValue = "Current value is required";
    if (!currentCommission)
      newErrors.currentCommission = "Current commission is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewInvestmentInputs = () => {
    const newErrors = {};

    if (!newYield) newErrors.newYield = "New yield is required";
    if (!newCommission) newErrors.newCommission = "New commission is required";
    if (!newTransactionFee)
      newErrors.newTransactionFee = "New transaction fee is required";
    if (!yearsToProject)
      newErrors.yearsToProject = "Years to project is required";

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

  const adjustForInflation = (deposits) => {
    console.log("Adjusting deposits for inflation");
    
    return deposits.flatMap((deposit) => {
      const depositYear = parseInt(deposit.year);
      const amount = parseFloat(deposit.amount);

      if (useMonthlyData) {
        const startMonth = parseInt(deposit.startMonth);
        const endMonth = parseInt(deposit.endMonth);
        let adjustedDeposits = [];

        for (let month = startMonth; month <= endMonth; month++) {
          const monthStr = month.toString().padStart(2, '0');
          const dateString = `${depositYear}-${monthStr}-01`;
          console.log(`Looking for CPI value for date: ${month}/${depositYear}`);
          
          const cpiValue = getCPIValue(dateString);
          console.log(`Found CPI value: ${cpiValue}`);
          
          if (!cpiValue) {
            console.log(`No CPI value found for ${month}/${depositYear}`);
            continue;
          }
          
          const currentCPI = cpiData[0].value;
          const adjustedAmount = amount * (currentCPI / cpiValue);
          console.log(`Adjusted amount for ${month}/${depositYear}: ${adjustedAmount}`);
          
          adjustedDeposits.push({
            year: depositYear,
            month,
            amount: adjustedAmount,
          });
        }
        return adjustedDeposits;
      } else {
        const dateString = `${depositYear}-01-01`;
        console.log(`Looking for CPI value for date: 1/${depositYear}`);
        
        const cpiValue = getCPIValue(dateString);
        console.log(`Found CPI value: ${cpiValue}`);
        
        if (!cpiValue) {
          console.log(`No CPI value found for 1/${depositYear}`);
          return [];
        }
        
        const currentCPI = cpiData[0].value;
        const adjustedAmount = amount * (currentCPI / cpiValue);
        console.log(`Adjusted amount for 1/${depositYear}: ${adjustedAmount}`);
        
        return [{
          year: depositYear,
          amount: adjustedAmount,
        }];
      }
    });
  };

  const calculateTax = (currentValue, adjustedDeposits) => {
    const adjustedTotalDeposited = adjustedDeposits.reduce(
      (sum, deposit) => sum + deposit.amount,
      0
    );
    
    // Only calculate tax on the real gain
    const realGain = Math.max(0, currentValue - adjustedTotalDeposited);
    
    let taxRate = 0.25; // Default tax rate
    if (realGain > 721560) {
      taxRate = 0.28; // Higher tax rate for gains above 721,560 NIS
    }

    return realGain * taxRate;
  };

  const calculateCurrentYield = (deposits, currentValue) => {
    console.log("--- Starting calculateCurrentYield ---");
    console.log("Deposits:", deposits);
    console.log("Current Value:", currentValue);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    console.log("Current Year:", currentYear);
    console.log("Current Month:", currentMonth);

    let totalInvestment = 0;
    let weightedTime = 0;

    deposits.forEach(deposit => {
      const depositYear = parseInt(deposit.year);
      const depositAmount = parseFloat(deposit.amount);

      console.log(`Processing deposit: Year ${depositYear}, Amount ${depositAmount}`);

      if (useMonthlyData) {
        const startMonth = parseInt(deposit.startMonth);
        const endMonth = parseInt(deposit.endMonth);
        
        console.log(`Monthly data: Start Month ${startMonth}, End Month ${endMonth}`);

        for (let month = startMonth; month <= endMonth; month++) {
          const yearsElapsed = (currentYear - depositYear) + (currentMonth - month) / 12;
          const monthlyAmount = depositAmount;
          totalInvestment += monthlyAmount;
          weightedTime += monthlyAmount * (1 - yearsElapsed / (currentYear - depositYear + 1));

          console.log(`Month ${month}: Years Elapsed ${yearsElapsed.toFixed(2)}, Running Total ${totalInvestment.toFixed(2)}, Weighted Time ${weightedTime.toFixed(2)}`);
        }
      } else {
        const yearsElapsed = currentYear - depositYear + (currentMonth - 1) / 12;
        totalInvestment += depositAmount;
        weightedTime += depositAmount * (1 - yearsElapsed / (currentYear - depositYear + 1));

        console.log(`Yearly data: Years Elapsed ${yearsElapsed.toFixed(2)}, Running Total ${totalInvestment.toFixed(2)}, Weighted Time ${weightedTime.toFixed(2)}`);
      }
    });

    console.log("Final Total Investment:", totalInvestment.toFixed(2));
    console.log("Final Weighted Time:", weightedTime.toFixed(2));

    const averageInvestmentTime = weightedTime / totalInvestment;
    console.log("Average Investment Time:", averageInvestmentTime.toFixed(2));

    const totalReturn = (currentValue / totalInvestment) - 1;
    console.log("Total Return:", totalReturn.toFixed(4));

    const annualYield = Math.pow(1 + totalReturn, 1 / (currentYear - Math.min(...deposits.map(d => parseInt(d.year))) + 1)) - 1;
    console.log("Calculated Annual Yield:", annualYield.toFixed(4));

    console.log("--- Ending calculateCurrentYield ---");

    return annualYield;
  };

  const projectInvestment = (
    startValue,
    yieldRate,
    commissionRate,
    transactionFee,
    years
  ) => {
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
      console.log("Validation errors:", errors);
      return;
    }

    const currentValueNum = parseFloat(currentValue);
    console.log("Current Value Num:", currentValueNum);
  
    const adjustedDeposits = adjustForInflation(deposits);
    console.log("Adjusted Deposits:", adjustedDeposits);
  
    const adjustedTotalDeposited = adjustedDeposits.reduce(
      (sum, deposit) => sum + deposit.amount,
      0
    );
    console.log("Adjusted Total Deposited:", adjustedTotalDeposited);
  
    const realGain = currentValueNum - adjustedTotalDeposited;
    console.log("Real Gain:", realGain);
  
    const taxAmount = calculateTax(currentValueNum, adjustedDeposits);
    console.log("Tax Amount:", taxAmount);
  
    const availableMoneyForNewInvestment = currentValueNum - taxAmount;
    console.log("Available Money for New Investment:", availableMoneyForNewInvestment);

    setCurrentInvestmentResults({
      currentYieldNum: calculateCurrentYield(deposits, currentValueNum),
      realGain,
      taxAmount,
      availableMoneyForNewInvestment,
    });
  };

  const compareNewInvestment = () => {
    if (!validateNewInvestmentInputs()) return;
    if (!currentInvestmentResults) {
      setErrors({
        currentInvestment: "Please calculate the current investment performance first.",
      });
      return;
    }

    console.log("--- Starting comparison calculations ---");

    const currentYieldToUse = useExistingYield
      ? currentInvestmentResults.currentYieldNum
      : parseFloat(manualCurrentYield) / 100;
    console.log("Current yield to use:", currentYieldToUse);

    const newYieldNum = parseFloat(newYield) / 100;
    const newCommissionNum = parseFloat(newCommission) / 100;
    const newTransactionFeeNum = parseFloat(newTransactionFee) / 100;
    const yearsToProjectNum = parseInt(yearsToProject);
    const partialPercentage = parseFloat(partialInvestmentPercentage) / 100;
    console.log("New yield:", newYieldNum, "New commission:", newCommissionNum, "New transaction fee:", newTransactionFeeNum);
    console.log("Years to project:", yearsToProjectNum, "Partial percentage:", partialPercentage);

    const grossCurrentInvestment = parseFloat(currentValue);
    const netCurrentInvestment = currentInvestmentResults.availableMoneyForNewInvestment;
    console.log("Gross current investment:", grossCurrentInvestment, "Net current investment:", netCurrentInvestment);

    const partialInvestmentAmount = netCurrentInvestment * partialPercentage;
    const remainingInvestmentAmount = netCurrentInvestment * (1 - partialPercentage);
    console.log("Partial investment amount:", partialInvestmentAmount, "Remaining investment amount:", remainingInvestmentAmount);

    // Project gross values
    console.log("--- Projecting investments ---");
    const currentProjection = projectInvestment(
      grossCurrentInvestment,
      currentYieldToUse,
      parseFloat(currentCommission) / 100,
      0,
      yearsToProjectNum
    );
    console.log("Current projection:", currentProjection);

    const newProjection = projectInvestment(
      partialInvestmentAmount,
      newYieldNum,
      newCommissionNum,
      newTransactionFeeNum,
      yearsToProjectNum
    );
    console.log("New projection (partial):", newProjection);

    const remainingProjection = projectInvestment(
      remainingInvestmentAmount,
      currentYieldToUse,
      parseFloat(currentCommission) / 100,
      0,
      yearsToProjectNum
    );
    console.log("Remaining projection:", remainingProjection);

    const combinedNewProjection = newProjection.map(
      (value, index) => value + remainingProjection[index]
    );
    console.log("Combined new projection:", combinedNewProjection);

    // Calculate net values
    console.log("--- Calculating net values ---");
    const netCurrentProjection = [netCurrentInvestment];
    const netNewProjection = [netCurrentInvestment];

    // Use adjusted deposits with fetchedCPIData
    const adjustedTotalDeposits = adjustForInflation(deposits).reduce(
      (sum, deposit) => sum + deposit.amount,
      0
    );
    console.log("Adjusted total deposits:", adjustedTotalDeposits);

    for (let i = 1; i <= yearsToProjectNum; i++) {
      const currentGrossValue = currentProjection[i];
      const newGrossValue = combinedNewProjection[i];

      const netCurrentValue = calculateNetAmount(currentGrossValue, adjustedTotalDeposits, taxRate);
      const netNewValue = calculateNetAmount(newGrossValue, adjustedTotalDeposits, taxRate);

      netCurrentProjection.push(netCurrentValue);
      netNewProjection.push(netNewValue);

      console.log(`Year ${i}:`);
      console.log(`  Current: Gross=${currentGrossValue}, Net=${netCurrentValue}`);
      console.log(`  New: Gross=${newGrossValue}, Net=${netNewValue}`);
    }

    console.log("Net current projection:", netCurrentProjection);
    console.log("Net new projection:", netNewProjection);

    const breakEvenYear = findBreakEvenPoint(netCurrentProjection, netNewProjection);
    console.log("Break-even year:", breakEvenYear);

    const chartData = currentProjection.map((value, index) => ({
      year: index,
      current: value,
      new: combinedNewProjection[index],
      netCurrent: netCurrentProjection[index],
      netNew: netNewProjection[index],
    }));

    console.log("Chart data:", chartData);

    setComparisonResults({
      currentFinalValue: currentProjection[yearsToProjectNum],
      newFinalValue: combinedNewProjection[yearsToProjectNum],
      breakEvenYear,
      chartData,
      recommendation:
        netNewProjection[yearsToProjectNum] > netCurrentProjection[yearsToProjectNum]
          ? "Consider moving the specified portion to the new investment mechanism."
          : "Stay with the current investment mechanism.",
    });

    console.log("--- Comparison calculations complete ---");
  };

  const numberFormatter = (value) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatTooltip = (value, name, props) => {
  
    // Define which names should not trigger any tooltip content
    const noTooltipNames = ["Net Current Investment", "Net New Investment"];
    
    // Check if the current name is in the list of names that shouldn't show tooltip
    if (noTooltipNames.includes(name)) {
      return [];  // Return an empty array to suppress the tooltip entirely for these lines
    }
  
    // Proceed with normal tooltip formatting for other lines
    const { current, new: newInvest, netCurrent, netNew } = props.payload;
    const formatNumber = (num) => num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  
    let tooltipContent = [];
  
    // Mapping names to their display content, excluding net values directly here
    const dataMap = {
      "Current Investment": `Existing investment: ₪${formatNumber(current)} (Net: ₪${formatNumber(netCurrent)})`,
      "New Investment": `New investment: ₪${formatNumber(newInvest)} (Net: ₪${formatNumber(netNew)})`
    };
  
    if (dataMap[name]) {
      tooltipContent.push(dataMap[name]);
    }
  
    return tooltipContent;
  };
  
  const calculateNetAmount = (grossValue, adjustedTotalDeposits, taxRate) => {
    const realGain = Math.max(0, grossValue - adjustedTotalDeposits);
    const taxAmount = realGain * taxRate;
    return grossValue - taxAmount;
  };
  
  return (
    <div className="container">
      <h1 className="title">Should I move my money?</h1>
      <div className="card">
        <h2>Current investment</h2>

        <div className="data-frequency-selection">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useMonthlyData}
              onChange={(e) => setUseMonthlyData(e.target.checked)}
            />
            Use monthly data
          </label>
          <span 
            className="tooltip-icon" 
            data-tooltip="Monthly data will generate more accurate results due to CPI changes"
          >
            ?
          </span>
        </div>

        <h3>Deposits</h3>
        {deposits.map((deposit, index) => (
          <div key={index} className="deposit-row">
            <input
              type="number"
              placeholder="Year"
              value={deposit.year}
              onChange={(e) =>
                handleDepositChange(index, "year", e.target.value)
              }
              className="input"
            />
            {useMonthlyData && (
              <>
                <select
                  value={deposit.startMonth}
                  onChange={(e) =>
                    handleDepositChange(index, "startMonth", e.target.value)
                  }
                  className="input"
                >
                  <option value="">Start Month</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={deposit.endMonth}
                  onChange={(e) =>
                    handleDepositChange(index, "endMonth", e.target.value)
                  }
                  className="input"
                >
                  <option value="">End Month</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </>
            )}
            <NumericFormat
              thousandSeparator=","
              prefix="₪"
              placeholder={useMonthlyData ? "Amount per month" : "Amount"}
              value={deposit.amount}
              onValueChange={(values) => {
                const { value } = values;
                handleDepositChange(index, "amount", value);
              }}
              className="input"
            />
            <button
              onClick={() => handleRemoveDeposit(index)}
              className="button-gray"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={handleAddDeposit} className="button-secondary">
          + Add deposit
        </button>
        <hr className="divider" />
        {errors.deposits && <span className="error">{errors.deposits}</span>}

        <NumericFormat
          thousandSeparator=","
          prefix="₪"
          placeholder="Current Value"
          value={currentValue}
          onValueChange={(values) => {
            const { value } = values;
            setCurrentValue(value);
          }}
          className="input"
        />
        {errors.currentValue && (
          <span className="error">{errors.currentValue}</span>
        )}
        <NumericFormat
          suffix="%"
          decimalScale={2}
          placeholder="Current Commission (%)"
          value={currentCommission}
          onValueChange={(values) => {
            const { value } = values;
            setCurrentCommission(value);
          }}
          className="input"
        />
        {errors.currentCommission && (
          <span className="error">{errors.currentCommission}</span>
        )}
        
        <button onClick={calculateCurrentInvestment} className="button">
          Calculate Current Investment
        </button>
        {errors.currentInvestment && (
          <span className="error">{errors.currentInvestment}</span>
        )}
      </div>

      {currentInvestmentResults && (
        <div className="card">
          <h3>Current investment results</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li style={{ marginBottom: '0.5em' }}>
              Calculated annual yield:{" "}
              {(currentInvestmentResults.currentYieldNum * 100).toFixed(2)}%
            </li>
            <li style={{ marginBottom: '0.5em' }}>
              Expected real gain: ₪
              {currentInvestmentResults.realGain.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </li>
            <li style={{ marginBottom: '0.5em' }}>
              Expected capital tax to be paid: ₪
              {currentInvestmentResults.taxAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </li>
            <li style={{ marginBottom: '0.5em' }}>
              Expected available money for the new investment: ₪
              {currentInvestmentResults.availableMoneyForNewInvestment.toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </li>
          </ul>
        </div>
      )}


      <div className="card new-investment-section">
        <h2>New investment</h2>
        <div className="input-row">
          <NumericFormat
            suffix="%"
            decimalScale={2}
            placeholder="Proportion of old investment to use (%)"
            value={partialInvestmentPercentage}
            onValueChange={(values) => {
              const { value } = values;
              setPartialInvestmentPercentage(value);
            }}
            className="input"
          />
          <NumericFormat
            suffix="%"
            decimalScale={2}
            placeholder="New expected yield (%)"
            value={newYield}
            onValueChange={(values) => {
              const { value } = values;
              setNewYield(value);
            }}
            className="input"
          />
        </div>
        <div className="input-row">
          <NumericFormat
            suffix="%"
            decimalScale={2}
            placeholder="New investment commission (%)"
            value={newCommission}
            onValueChange={(values) => {
              const { value } = values;
              setNewCommission(value);
            }}
            className="input"
          />
          <NumericFormat
            suffix="%"
            decimalScale={2}
            placeholder="New investment transaction fee (%)"
            value={newTransactionFee}
            onValueChange={(values) => {
              const { value } = values;
              setNewTransactionFee(value);
            }}
            className="input"
          />
          <NumericFormat
            decimalScale={0}
            placeholder="Years to project"
            value={yearsToProject}
            onValueChange={(values) => {
              const { value } = values;
              setYearsToProject(value);
            }}
            className="input"
          />
        </div>
        <div className="yield-selection">
          <div className="yield-selection-title">For the existing investment:</div>
          <label>
            <input
              type="radio"
              value="existing"
              checked={useExistingYield}
              onChange={() => setUseExistingYield(true)}
            />
            Use calculated yield
          </label>
          <label>
            <input
              type="radio"
              value="manual"
              checked={!useExistingYield}
              onChange={() => setUseExistingYield(false)}
            />
            Enter manual yield
          </label>
        </div>

        {!useExistingYield && (
          <NumericFormat
            suffix="%"
            decimalScale={2}
            placeholder="Manual current yield (%)"
            value={manualCurrentYield}
            onValueChange={(values) => {
              const { value } = values;
              setManualCurrentYield(value);
            }}
            className="input narrow-input"
          />
        )}
        <button onClick={compareNewInvestment} className="compare-button">
          Compare New Investment
        </button>
      </div>


      {comparisonResults && (
        <div className="card">
          <h2>Results</h2>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li style={{ marginBottom: '0.5em' }}>
              Current investment gross value after {yearsToProject} years: ₪
              {comparisonResults.currentFinalValue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </li>
            
            <li style={{ marginBottom: '0.5em' }}>
              New investment gross value after {yearsToProject} years: ₪
              {comparisonResults.newFinalValue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </li>
            
            <li style={{ marginBottom: '0.5em' }}>Break-even point: {comparisonResults.breakEvenYear} years</li>
          </ul>
          <p>
            <strong>{comparisonResults.recommendation}</strong>
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparisonResults.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={numberFormatter} />
              <Tooltip formatter={formatTooltip}
              labelFormatter={(value) => `Years: ${value}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#8884d8"
                name="Current Investment"
              />
              <Line
                type="monotone"
                dataKey="new"
                stroke="#82ca9d"
                name="New Investment"
              />
              <Line
                type="monotone"
                dataKey="netCurrent"
                stroke="#8884d8"
                name="Net Current Investment"
                strokeDasharray="5 5"
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="netNew"
                stroke="#82ca9d"
                name="Net New Investment"
                strokeDasharray="5 5"
                legendType="none"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default IsraeliInvestmentAnalyzer;