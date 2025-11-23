"""
Test script for career recommendation improvements
"""

import asyncio
import json
from utils.gemini_chatbot import GeminiChatBot
from agents_v2.pipeline import CareerAnalysisPipeline

# Sample transcript simulating a voice conversation
TEST_TRANSCRIPT = """
User: Hi, I'm interested in exploring new career options.

Lisa: Great! Tell me a bit about yourself. What kind of work do you currently do?

User: I'm a software engineer with about 5 years of experience. I mostly work with Python and React. I'm interested in AI and machine learning, but I don't have deep expertise yet.

Lisa: That's interesting! What are you looking for in your next career move?

User: I want something that lets me work remotely, ideally with flexible hours. I'm passionate about using technology to solve real-world problems, especially in healthcare or education. I don't want to be managing people - I prefer hands-on technical work.

Lisa: Got it! And what about your long-term goals?

User: I'd like to eventually become a technical expert in AI/ML within the next 3-5 years. I value work-life balance and working with mission-driven organizations. Salary is important, but not my top priority.

Lisa: Perfect, I have a good understanding now. Let me analyze your profile and recommend some careers.
"""

async def test_career_recommendations():
    """Test the career recommendation pipeline with improved scoring"""
    print("=" * 80)
    print("Testing Career Recommendation Improvements")
    print("=" * 80)

    # Initialize pipeline
    print("\n1. Initializing pipeline...")
    pipeline = CareerAnalysisPipeline(llm_provider="gemini", model_name="gemini-2.0-flash")

    # Run analysis
    print("\n2. Analyzing transcript...")
    print(f"   Transcript length: {len(TEST_TRANSCRIPT)} characters")

    result = await pipeline.analyze(TEST_TRANSCRIPT)

    # Display results
    print("\n3. Analysis Results:")
    print(f"   Total recommendations: {len(result['careerRecommendations'])}")

    # Analyze score distribution
    recommendations = result['careerRecommendations']
    high_scores = [r for r in recommendations if r['fitScore'] >= 85]
    mid_scores = [r for r in recommendations if 70 <= r['fitScore'] < 85]
    low_scores = [r for r in recommendations if 60 <= r['fitScore'] < 70]
    very_low = [r for r in recommendations if r['fitScore'] < 60]

    print("\n4. Score Distribution:")
    print(f"   High (85-95):  {len(high_scores)} careers ({len(high_scores)/len(recommendations)*100:.1f}%)")
    print(f"   Mid (70-84):   {len(mid_scores)} careers ({len(mid_scores)/len(recommendations)*100:.1f}%)")
    print(f"   Low (60-69):   {len(low_scores)} careers ({len(low_scores)/len(recommendations)*100:.1f}%)")
    print(f"   Very low (<60): {len(very_low)} careers ({len(very_low)/len(recommendations)*100:.1f}%)")

    # Display top 5 recommendations
    print("\n5. Top 5 Career Recommendations:")
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"\n   {i}. {rec['careerName']} ({rec['fitScore']}%)")
        print(f"      Industry: {rec['industry']}")
        print(f"      Why good fit: {rec['whyGoodFit'][:100]}...")

    # Check if "whyGoodFit" references conversation
    print("\n6. Checking Conversation Relevance:")
    conversation_keywords = ["remote", "flexible", "AI", "ML", "healthcare", "education", "technical", "Python", "React"]

    mentions = 0
    for rec in recommendations[:5]:
        why_fit = rec['whyGoodFit'].lower()
        for keyword in conversation_keywords:
            if keyword.lower() in why_fit:
                mentions += 1
                break

    print(f"   {mentions}/5 top recommendations reference specific conversation details")

    # Validation
    print("\n7. Validation:")

    issues = []

    # Check if distribution is realistic
    if len(high_scores) > len(recommendations) * 0.6:
        issues.append(f"Too many high scores: {len(high_scores)}/{len(recommendations)}")

    if len(low_scores) < len(recommendations) * 0.15:
        issues.append(f"Not enough variety: only {len(low_scores)} low-tier careers")

    # Check if careers are relevant
    if mentions < 3:
        issues.append(f"Careers don't seem to match conversation: only {mentions}/5 reference specific details")

    if issues:
        print("   ❌ Issues found:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print("   ✅ All validations passed!")

    print("\n" + "=" * 80)
    print("Test Complete")
    print("=" * 80)

    # Save results to file for inspection
    with open('/Users/seanchiu/Desktop/path-finder/main/python-backend/test_results.json', 'w') as f:
        json.dump({
            "recommendations": recommendations,
            "distribution": {
                "high": len(high_scores),
                "mid": len(mid_scores),
                "low": len(low_scores),
                "very_low": len(very_low)
            },
            "conversation_relevance": f"{mentions}/5"
        }, f, indent=2)

    print("\n📄 Full results saved to: python-backend/test_results.json")

if __name__ == "__main__":
    asyncio.run(test_career_recommendations())
