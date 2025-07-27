def generate_savings_tips(summary, subscriptions):
    print("[Tool] Using mock LLM to generate savings...")
    tips = []
    for category, amount in summary["category_spend"].items():
        if amount > 1000:
            tips.append({
                "category": category,
                "suggestion": f"Consider reducing spend in {category} — try cheaper options."
            })
    for sub in subscriptions:
        tips.append({
            "category": "subscriptions",
            "suggestion": f"Review your {sub['name']} subscription. Consider pausing if not used."
        })
    return tips