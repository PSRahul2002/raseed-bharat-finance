from tools.prompt_tool import generate_savings_tips

class SavingsAdvisorAgent:
    def run(self, summary, subscriptions):
        print("[Agent] Generating savings advice...")
        return generate_savings_tips(summary, subscriptions)