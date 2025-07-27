class WalletPassGeneratorAgent:
    def run(self, summary, tips):
        print("[Agent] Creating Wallet Pass...")
        return {
            "pass_id": "wallet_user123",
            "summary": f"Total spend: ₹{summary['total_spend']}",
            "details": "\n".join([tip["suggestion"] for tip in tips])
        }