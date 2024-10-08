# Should I move my money?

This project is a browser-based investment analysis tool that helps compare current investments with potential new investment opportunities, taking into account factors such as deposits, yields, commissions, and inflation.

## Features

- Input multiple deposits with corresponding years
- Enter current investment details (value, yield, commission)
- Specify new investment parameters (expected yield, commission, transaction fee)
- Analyze and compare investments over a specified number of years
- View results including break-even point and investment value projections
- Visualize comparison with an interactive chart

## Versions

### 1.1.0 (2024-08-10)

- Added a Surtax ("MAs Yesef") for every Shekel above 721,560 NIS
- Added predicitons for net amounts (net current investment, net new investment)

### 1.0.0 (2024-07-15)

- Initial release

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/oferfive/Should_i_move_my_money.git
   cd Should_i_move_my_money
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Usage

1. Enter your deposit history in the "Deposits" section.
2. Input your current investment details.
3. Specify the parameters for the new potential investment.
4. Enter the number of years for projection.
5. Click "Analyze" to see the comparison results and chart.

## Contributing

Contributions are welcome! Please feel free fork, create a new branch, commit and submit a Pull Request.

## License

This project is licensed under the MIT License - see the [license.md](license.md) file for details.

## Acknowledgments & Disclaimer

- This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
- Charts are rendered using [Recharts](https://recharts.org/).
- This tool was built out of good will, and the creator does not hold responsibility for any decisions made using this tool, as mistakes might occur.