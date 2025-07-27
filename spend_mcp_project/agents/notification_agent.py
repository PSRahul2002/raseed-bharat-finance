class NotificationAgent:
    def run(self, pass_data):
        print("[Agent] Sending notification...")
        print(f"🔔 {pass_data['summary']}")
        print(f"📝 {pass_data['details']}")