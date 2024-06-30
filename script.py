import datetime
import matplotlib.pyplot as plt

# Define ANSI escape codes for colors (only for recommendation)
BOLD = '\033[1m'
DARK_GREEN = '\033[38;2;92;128;1m'  # #5C8001
RED = '\033[38;2;251;52;7m'       # #FB3407
END = '\033[0m'

class IsraeliInvestmentAnalyzer:
    def __init__(self):
        self.tax_rate = 0.25  # Standard capital gains tax rate in Israel
        self.cpi_data = {
            2015: 100.0, 2016: 100.0, 2017: 100.2, 2018: 101.0, 2019: 101.9,
            2020: 101.3, 2021: 102.8, 2022: 107.3, 2023: 111.8, 2024: 113.8
        }
        self.yearly_deposits = {}
        self.current_value = 0
        self.current_yield = 0
        self.new_yield = 0
        self.current_commission = 0
        self.new_commission = 0
        self.new_transaction_fee = 0
        self.years_to_project = 0

    def print_instructions(self):
        print("\n" + "="*50)
        print(f"{BOLD}Instructions:{END}")
        print("- Enter the year and deposit amount when prompted.")
        print("- Type 'undo' to remove the last entered deposit.")
        print("- Type 'done' to finish entering deposits and proceed.")
        print("- Type 'help' at any time to see these instructions again.")
        print("="*50 + "\n")

    def get_current_investment_details(self):
        print("Please enter your current investment details:")
        self.print_instructions()
        while True:
            year_input = input("Enter the year of deposit (or 'done', 'undo', 'help'): ")
            if year_input.lower() == 'done':
                if not self.yearly_deposits:
                    print("You must enter at least one deposit before proceeding.")
                    continue
                break
            elif year_input.lower() == 'undo':
                if self.yearly_deposits:
                    last_year = max(self.yearly_deposits.keys())
                    del self.yearly_deposits[last_year]
                    print(f"Removed deposit for year {last_year}")
                else:
                    print("No deposits to undo.")
                continue
            elif year_input.lower() == 'help':
                self.print_instructions()
                continue
            
            try:
                year = int(year_input)
                deposit = float(input(f"Enter total deposit amount for {year}: "))
                self.yearly_deposits[year] = deposit
                print(f"Added deposit of ₪{deposit:.2f} for year {year}")
            except ValueError:
                print("Invalid input. Please enter a valid year and deposit amount.")

        while True:
            try:
                self.current_value = float(input("Enter the current total worth of the investment: "))
                self.current_commission = float(input("Current investment's annual commission rate (as a decimal, e.g., 0.01 for 1%): "))
                break
            except ValueError:
                print("Invalid input. Please enter valid numeric values.")

    def calculate_yields(self):
        total_deposited = sum(self.yearly_deposits.values())
        years = max(self.yearly_deposits.keys()) - min(self.yearly_deposits.keys()) + 1

        overall_yield = (self.current_value - total_deposited) / total_deposited
        annual_yield = (1 + overall_yield) ** (1/years) - 1

        return overall_yield, annual_yield

    def get_new_investment_details(self):
        print("\nPlease enter details for the potential new investment:")
        print("(Type 'undo' at any prompt to remove the last entered detail)")
        details = {}
        questions = [
            ("Expected annual yield", "New investment's expected annual yield (as a decimal, e.g., 0.08 for 8%): "),
            ("Annual commission rate", "New investment's annual commission rate (as a decimal, e.g., 0.015 for 1.5%): "),
            ("Transaction fee rate", "New investment's transaction fee rate (as a decimal, e.g., 0.001 for 0.1%): "),
            ("Years to project", "Number of years to project for comparison: ")
        ]
        
        for key, prompt in questions:
            while True:
                user_input = input(prompt)
                if user_input.lower() == 'undo':
                    if details:
                        removed_key, removed_value = details.popitem()
                        print(f"Removed: {removed_key} = {removed_value}")
                    else:
                        print("Nothing to undo.")
                    continue
                
                try:
                    if key == "Years to project":
                        value = int(user_input)
                    else:
                        value = float(user_input)
                    details[key] = value
                    break
                except ValueError:
                    print("Invalid input. Please enter a valid number.")
        
        self.new_yield = details['Expected annual yield']
        self.new_commission = details['Annual commission rate']
        self.new_transaction_fee = details['Transaction fee rate']
        self.years_to_project = details['Years to project']

        print("\nNew investment details summary:")
        for key, value in details.items():
            print(f"{key}: {value}")

    def calculate_tax(self):
        adjusted_deposits = self.adjust_for_inflation()
        adjusted_total_deposited = sum(adjusted_deposits.values())
        print(f"Total adjusted deposits: ₪{adjusted_total_deposited:.2f}")

        real_gain = self.current_value - adjusted_total_deposited
        if real_gain <= 0:
            return 0, adjusted_total_deposited

        tax = real_gain * self.tax_rate
        return tax, adjusted_total_deposited

    def adjust_for_inflation(self):
        latest_cpi = self.get_latest_cpi()
        print(f"Latest CPI: {latest_cpi}")
        adjusted_deposits = {}
        for year, deposit in self.yearly_deposits.items():
            cpi_for_year = self.cpi_data.get(year, latest_cpi)
            adjustment_factor = latest_cpi / cpi_for_year
            adjusted_deposit = deposit * adjustment_factor
            adjusted_deposits[year] = adjusted_deposit
            print(f"Year: {year}, Original: ₪{deposit:.2f}, CPI: {cpi_for_year}, Adjusted: ₪{adjusted_deposit:.2f}")
        return adjusted_deposits

    def get_latest_cpi(self):
        return self.cpi_data[max(self.cpi_data.keys())]

    def project_investment(self, start_value, yield_rate, commission_rate, transaction_fee, years):
        value = start_value * (1 - transaction_fee)
        for _ in range(years):
            value *= (1 + yield_rate) * (1 - commission_rate)
        return value

    def find_break_even_point(self, current_value, new_value):
        year = 0
        while new_value <= current_value and year <= 100:
            year += 1
            current_value *= (1 + self.current_yield) * (1 - self.current_commission)
            new_value *= (1 + self.new_yield) * (1 - self.new_commission)
        return year if year <= 100 else "Never"

    def analyze_current_investment(self):
        self.get_current_investment_details()
        overall_yield, annual_yield = self.calculate_yields()

        print(f"\nOverall yield of current investment: {overall_yield:.2%}")
        print(f"Calculated average annual yield of current investment: {annual_yield:.2%}")

        use_calculated = input("Do you want to use this calculated annual yield for comparison? (y/n): ").lower() == 'y'
        self.current_yield = annual_yield if use_calculated else float(input("Enter the annual yield to use for comparison (as a decimal, e.g., 0.05 for 5%): "))

        tax, adjusted_total_deposited = self.calculate_tax()

        print("\nCurrent Investment Analysis:")
        print(f"Total deposited: ₪{sum(self.yearly_deposits.values()):,.2f}")
        print(f"Inflation-adjusted total deposited: ₪{adjusted_total_deposited:,.2f}")
        print(f"Current value: ₪{self.current_value:,.2f}")
        print(f"Real capital gain: ₪{self.current_value - adjusted_total_deposited:,.2f}")
        print(f"Estimated tax owed if sold: ₪{tax:,.2f}")
        print(f"Amount available for reinvestment after tax: ₪{self.current_value - tax:,.2f}")

        return tax

    def compare_investments(self, tax):
        self.get_new_investment_details()
        amount_after_tax = self.current_value - tax

        current_investment_values = [self.project_investment(self.current_value, self.current_yield, self.current_commission, 0, year) for year in range(self.years_to_project + 1)]
        new_investment_values = [self.project_investment(amount_after_tax, self.new_yield, self.new_commission, self.new_transaction_fee, year) for year in range(self.years_to_project + 1)]

        break_even_year = self.find_break_even_point(self.current_value, amount_after_tax)

        print("\nInvestment Comparison:")
        print(f"Value after {self.years_to_project} years if kept in current investment: ₪{current_investment_values[-1]:,.2f}")
        print(f"Value after {self.years_to_project} years if moved to new investment: ₪{new_investment_values[-1]:,.2f}")
        print(f"Break-even point: {break_even_year} years")

        if new_investment_values[-1] > current_investment_values[-1]:
            print(f"{BOLD}{DARK_GREEN}Recommendation: Consider moving to the new investment mechanism.{END}")
        else:
            print(f"{BOLD}{RED}Recommendation: Stay with the current investment mechanism.{END}")

        self.visualize_yields(current_investment_values, new_investment_values)

    def visualize_yields(self, current_values, new_values):
        years = list(range(self.years_to_project + 1))
        
        plt.figure(figsize=(10, 6))
        plt.plot(years, current_values, label='Current Investment', marker='o')
        plt.plot(years, new_values, label='New Investment', marker='s')
        
        plt.title('Investment Value Projection')
        plt.xlabel('Years')
        plt.ylabel('Investment Value (₪)')
        plt.legend()
        plt.grid(True)
        
        plt.savefig('investment_comparison.png')
        print("\nInvestment comparison graph saved as 'investment_comparison.png'")

    def run_analysis(self):
        tax = self.analyze_current_investment()
        input("\nPress Enter to continue to the new investment comparison...")
        self.compare_investments(tax)

# Run the analysis
if __name__ == "__main__":
    analyzer = IsraeliInvestmentAnalyzer()
    analyzer.run_analysis()