from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the app. It should redirect to the HR dashboard.
            page.goto("http://localhost:3000/", timeout=90000) # Increased timeout

            # Wait for a unique element on the HR Dashboard to ensure it's loaded
            dashboard_element = page.locator(".employee-details")
            expect(dashboard_element).to_be_visible(timeout=60000)

            # Take a screenshot for visual verification
            page.screenshot(path="jules-scratch/verification/hr_dashboard_verification.png")

            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()