class SubscriptionDetectorAgent:
    def run(self, receipts):
        print("[Agent] Detecting subscriptions...")
        subs = []
        for r in receipts:
            if "subscription" in r.get("tags", []):
                subs.append({
                    "name": r["merchant"],
                    "amount": r["amount"],
                    "frequency": "monthly"  # simplified assumption
                })
        return subs