from tools.firestore_tool import get_receipts

class ReceiptFetcherAgent:
    def run(self, user_id):
        print("[Agent] Fetching receipts...")
        return get_receipts(user_id)