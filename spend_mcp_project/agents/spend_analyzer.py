from collections import defaultdict

class SpendAnalyzerAgent:
    def run(self, receipts):
        print("[Agent] Analyzing spend...")
        summary = {
            "total_spend": 0,
            "category_spend": defaultdict(float),
            "trends": {}
        }
        for r in receipts:
            print("Receipt amount field:", r.get("amount"))
        try:
            amt = float(r.get("amount", 0))
        except Exception as e:
            print(f"Invalid amount: {r.get('amount')}, error: {e}")
            amt = 0
        cat = r.get("category", "other")
        summary["category_spend"][cat] += amt
        summary["total_spend"] += amt
        return summary