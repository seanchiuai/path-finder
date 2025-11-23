"""
Career library with basic career data for matching and recommendations.
This is a simple MVP dataset; in production, this would query external APIs.
"""

CAREER_LIBRARY = [
    {
        "careerId": "fullstack-dev",
        "careerName": "Full Stack Developer",
        "industry": "Technology",
        "description": "Build end-to-end web applications using modern frameworks and databases",
        "medianSalary": "$95,000 - $130,000",
        "growthOutlook": "22% (Much faster than average)",
        "estimatedTime": "8-12 months",
        "requiredSkills": ["javascript", "react", "node", "databases", "apis", "html", "css", "typescript"],
        "personalityFit": ["analytical", "creative", "problem-solver", "detail-oriented"],
        "values": ["innovation", "continuous-learning", "collaboration", "autonomy"],
    },
    {
        "careerId": "product-designer",
        "careerName": "Product Designer",
        "industry": "Design & UX",
        "description": "Design user-centered digital products with focus on usability and aesthetics",
        "medianSalary": "$85,000 - $120,000",
        "growthOutlook": "16% (Faster than average)",
        "estimatedTime": "6-10 months",
        "requiredSkills": ["figma", "sketch", "user-research", "prototyping", "visual-design", "ux", "ui"],
        "personalityFit": ["creative", "empathetic", "detail-oriented", "collaborative"],
        "values": ["user-focus", "aesthetics", "innovation", "collaboration"],
    },
    {
        "careerId": "data-scientist",
        "careerName": "Data Scientist",
        "industry": "Data & Analytics",
        "description": "Analyze complex data to drive business decisions using statistics and machine learning",
        "medianSalary": "$100,000 - $150,000",
        "growthOutlook": "36% (Much faster than average)",
        "estimatedTime": "10-18 months",
        "requiredSkills": ["python", "statistics", "machine-learning", "sql", "data-visualization", "pandas", "numpy"],
        "personalityFit": ["analytical", "curious", "methodical", "problem-solver"],
        "values": ["impact", "continuous-learning", "accuracy", "innovation"],
    },
    {
        "careerId": "product-manager",
        "careerName": "Product Manager",
        "industry": "Product & Strategy",
        "description": "Define product vision and roadmap, working cross-functionally to deliver value",
        "medianSalary": "$110,000 - $160,000",
        "growthOutlook": "10% (As fast as average)",
        "estimatedTime": "12-24 months",
        "requiredSkills": ["product-strategy", "stakeholder-management", "roadmapping", "analytics", "communication"],
        "personalityFit": ["strategic", "collaborative", "decisive", "communicative"],
        "values": ["impact", "leadership", "user-focus", "collaboration"],
    },
    {
        "careerId": "marketing-manager",
        "careerName": "Digital Marketing Manager",
        "industry": "Marketing",
        "description": "Develop and execute digital marketing strategies to grow brand and drive revenue",
        "medianSalary": "$75,000 - $115,000",
        "growthOutlook": "10% (As fast as average)",
        "estimatedTime": "6-12 months",
        "requiredSkills": ["seo", "content-marketing", "social-media", "analytics", "copywriting", "campaigns"],
        "personalityFit": ["creative", "analytical", "communicative", "strategic"],
        "values": ["creativity", "impact", "collaboration", "growth"],
    },
    {
        "careerId": "devops-engineer",
        "careerName": "DevOps Engineer",
        "industry": "Technology",
        "description": "Build and maintain infrastructure, CI/CD pipelines, and deployment automation",
        "medianSalary": "$100,000 - $140,000",
        "growthOutlook": "25% (Much faster than average)",
        "estimatedTime": "10-14 months",
        "requiredSkills": ["docker", "kubernetes", "aws", "linux", "terraform", "ci-cd", "monitoring"],
        "personalityFit": ["analytical", "problem-solver", "methodical", "detail-oriented"],
        "values": ["efficiency", "reliability", "automation", "continuous-learning"],
    },
    {
        "careerId": "ux-researcher",
        "careerName": "UX Researcher",
        "industry": "Design & UX",
        "description": "Conduct user research to inform product design and improve user experience",
        "medianSalary": "$80,000 - $120,000",
        "growthOutlook": "13% (Faster than average)",
        "estimatedTime": "8-12 months",
        "requiredSkills": ["user-research", "interviewing", "usability-testing", "data-analysis", "personas"],
        "personalityFit": ["empathetic", "analytical", "curious", "communicative"],
        "values": ["user-focus", "impact", "empathy", "collaboration"],
    },
    {
        "careerId": "content-writer",
        "careerName": "Content Strategist",
        "industry": "Marketing & Content",
        "description": "Create compelling content strategies and write engaging copy for digital audiences",
        "medianSalary": "$60,000 - $90,000",
        "growthOutlook": "9% (As fast as average)",
        "estimatedTime": "4-8 months",
        "requiredSkills": ["writing", "seo", "content-strategy", "editing", "storytelling", "research"],
        "personalityFit": ["creative", "communicative", "detail-oriented", "empathetic"],
        "values": ["creativity", "impact", "communication", "autonomy"],
    },
]


def get_career_by_id(career_id: str):
    """Retrieve a career from the library by ID."""
    for career in CAREER_LIBRARY:
        if career["careerId"] == career_id:
            return career
    return None
