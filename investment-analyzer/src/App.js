import React, { useState, useEffect } from "react";
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
import axios from "axios";

const IsraeliInvestmentAnalyzer = () => {
  const [useMonthlyData, setUseMonthlyData] = useState(false);
  const [deposits, setDeposits] = useState([{ year: "", month: "", amount: "" }]);
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
  const [cpiData, setCpiData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Static CPI data for fallback
  const staticCpiData = {
    2015: 100.0,
    2016: 100.0,
    2017: 100.2,
    2018: 101.0,
    2019: 101.9,
    2020: 101.3,
    2021: 102.8,
    2022: 107.3,
    2023: 111.8,
    2024: 113.8,
  };

  const fetchCPIData = async (startYear, endYear) => {
    setIsLoading(true);
    try {
      console.log(`Fetching CPI data from ${startYear} to ${endYear}`);
      let allData = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await axios.get(`https://api.cbs.gov.il/index/data/price`, {
          params: {
            id: 120010,
            startPeriod: `01-${startYear}`,
            endPeriod: `12-${endYear}`,
            format: 'json',
            download: false,
            lang: 'en',
            page: currentPage
          }
        });
        
        console.log(`Raw API response for page ${currentPage}:`, response.data);
        
        allData = [...allData, ...response.data.month[0].date];
        
        hasNextPage = response.data.paging.next_url !== null;
        currentPage++;
      }

      console.log("All fetched data:", allData);

      const monthlyData = {};
      allData.forEach(item => {
        if (!monthlyData[item.year]) {
          monthlyData[item.year] = {};
        }
        monthlyData[item.year][item.month] = item.currBase.value;
      });

      if (!useMonthlyData) {
        // Calculate average CPI for each year
        const averagedData = {};
        for (const year in monthlyData) {
          const yearData = Object.values(monthlyData[year]);
          averagedData[year] = yearData.reduce((sum, value) => sum + value, 0) / yearData.length;
        }
        console.log("Averaged CPI data:", averagedData);
        setCpiData(averagedData);
        return averagedData;
      } else {
        console.log("Monthly CPI data:", monthlyData);
        setCpiData(monthlyData);
        return monthlyData;
      }
    } catch (error) {
      console.error("Error fetching CPI data:", error);
      console.log("Using static CPI data as fallback");
      setErrors(prevErrors => ({...prevErrors, api: "Failed to fetch CPI data. Using static data as fallback."}));
      
      // Use static data as fallback
      return staticCpiData;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeposit = () => {
    setDeposits([...deposits, { year: "", month: useMonthlyData ? "" : undefined, amount: "" }]);
  };

  const validateCurrentInvestmentInputs = () => {
    const newErrors = {};

    if (deposits.some((d) => !d.year || !d.amount)) {
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

  const adjustForInflation = (deposits, cpiData) => {
    console.log("CPI data in adjustForInflation:", cpiData);
    if (Object.keys(cpiData).length === 0) {
      console.error("CPI data is not available");
      return deposits;
    }
    
    const getLatestCPI = () => {
      if (useMonthlyData) {
        const latestYear = Math.max(...Object.keys(cpiData).map(Number));
        const latestMonth = Math.max(...Object.keys(cpiData[latestYear]).map(Number));
        return cpiData[latestYear][latestMonth];
      } else {
        return Math.max(...Object.values(cpiData));
      }
    };
    
    const latestCPI = getLatestCPI();
    console.log("Latest CPI:", latestCPI);
    
    return deposits.map((deposit) => {
      const depositYear = parseInt(deposit.year);
      const depositMonth = useMonthlyData ? parseInt(deposit.month) : 12; // Use December for yearly data
      console.log(`Processing deposit for year ${depositYear}${useMonthlyData ? `, month ${depositMonth}` : ''}`);
      
      let depositCPI;
      if (useMonthlyData) {
        if (!cpiData[depositYear] || !cpiData[depositYear][depositMonth]) {
          console.warn(`No CPI data for year ${depositYear}, month ${depositMonth}, using latest CPI`);
          depositCPI = latestCPI;
        } else {
          depositCPI = cpiData[depositYear][depositMonth];
        }
      } else {
        if (!cpiData[depositYear]) {
          console.warn(`No CPI data for year ${depositYear}, using latest CPI`);
          depositCPI = latestCPI;
        } else {
          depositCPI = cpiData[depositYear];
        }
      }
      
      console.log(`CPI for ${depositYear}${useMonthlyData ? `-${depositMonth}` : ''}: ${depositCPI}`);
      const adjustedAmount = parseFloat(deposit.amount) * (latestCPI / depositCPI);
      console.log(`Original amount: ${deposit.amount}, Adjusted amount: ${adjustedAmount}`);
      return {
        year: depositYear,
        month: useMonthlyData ? depositMonth : undefined,
        amount: adjustedAmount,
      };
    });
  };

  const calculateTax = (currentValue, adjustedDeposits) => {
    const adjustedTotalDeposited = adjustedDeposits.reduce(
      (sum, deposit) => sum + deposit.amount,
      0
    );
    const realGain = currentValue - adjustedTotalDeposited;
  
    let taxRate = 0.25; // Default tax rate
    if (realGain > 721560) {
      taxRate = 0.28; // Higher tax rate for gains above 721,560 NIS
    }
  
    return realGain > 0 ? realGain * taxRate : 0;
  };

  const calculateCurrentYield = (deposits, currentValue) => {
    const totalDeposited = deposits.reduce(
      (sum, deposit) => sum + parseFloat(deposit.amount),
      0
    );

    // Find the first year with deposits
    const years = deposits.map((d) => parseInt(d.year));
    const firstYear = Math.min(...years);

    // Use the actual current year
    const currentYear = new Date().getFullYear();
    const investmentDuration = currentYear - firstYear + 1;

    const overallYield = (currentValue - totalDeposited) / totalDeposited;
    const annualYield = (1 + overallYield) ** (1 / investmentDuration) - 1;

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

  const calculateCurrentInvestment = async () => {
    if (!validateCurrentInvestmentInputs()) {
      console.log("Validation errors:", errors);
      return;
    }

    setIsLoading(true);

    // Determine the year range for CPI data
    const depositYears = deposits.map(d => parseInt(d.year));
    const startYear = Math.min(...depositYears);
    const endYear = new Date().getFullYear();

    // Fetch CPI data
    const fetchedCPIData = await fetchCPIData(startYear, endYear);
    
    console.log("Fetched CPI data:", fetchedCPIData);

    const currentValueNum = parseFloat(currentValue);
    console.log("Current Value Num:", currentValueNum);
  
    const adjustedDeposits = adjustForInflation(deposits, fetchedCPIData);
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

    setIsLoading(false);
  };

  const compareNewInvestment = async () => {
    if (!validateNewInvestmentInputs()) return;
    if (!currentInvestmentResults) {
      setErrors({
        currentInvestment: "Please calculate the current investment performance first.",
      });
      return;
    }

    // Determine the year range for CPI data
    const depositYears = deposits.map(d => parseInt(d.year));
    const startYear = Math.min(...depositYears);
    const endYear = new Date().getFullYear() + parseInt(yearsToProject);

    // Fetch CPI data
    const fetchedCPIData = await fetchCPIData(startYear, endYear);

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
    const adjustedTotalDeposits = adjustForInflation(deposits, fetchedCPIData).reduce(
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
  
  useEffect(() => {
    console.log("CPI data updated:", cpiData);
  }, [cpiData]);
  
  const calculateNetAmount = (grossValue, initialValue, taxRate) => {
    const realGain = grossValue - initialValue;
    const taxAmount = realGain > 0 ? realGain * taxRate : 0;
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
              <select
                value={deposit.month}
                onChange={(e) =>
                  handleDepositChange(index, "month", e.target.value)
                }
                className="input"
              >
                <option value="">Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            )}
            <NumericFormat
              thousandSeparator=","
              prefix="₪"
              placeholder="Amount"
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
      {isLoading && <div className="loading">Loading...</div>}
      {errors.api && <div className="error">{errors.api}</div>}
    </div>
  );
};

export default IsraeliInvestmentAnalyzer;
