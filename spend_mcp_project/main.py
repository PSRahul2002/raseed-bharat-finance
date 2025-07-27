from agents.receipt_fetcher import ReceiptFetcherAgent
from agents.spend_analyzer import SpendAnalyzerAgent
from agents.subscription_detector import SubscriptionDetectorAgent
from agents.savings_advisor import SavingsAdvisorAgent
from agents.wallet_pass_generator import WalletPassGeneratorAgent
from agents.notification_agent import NotificationAgent

def run_pipeline(user_id):
    print(f"[MCP] Running spend analysis for user: {user_id}")

    receipts = ReceiptFetcherAgent().run(user_id)
    summary = SpendAnalyzerAgent().run(receipts)
    subscriptions = SubscriptionDetectorAgent().run(receipts)
    tips = SavingsAdvisorAgent().run(summary, subscriptions)
    pass_data = WalletPassGeneratorAgent().run(summary, tips)
    NotificationAgent().run(pass_data)

if __name__ == "__main__":
    run_pipeline("psrahul2002@gmail.com")