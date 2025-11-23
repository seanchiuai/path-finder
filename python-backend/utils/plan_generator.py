"""
Action plan generator for selected careers.
Creates phases and tasks for each career path.
"""

import uuid
from typing import List, Dict, Any


def generate_action_plan(career_id: str, career_name: str) -> Dict[str, Any]:
    """
    Generate a basic action plan for a career.

    Returns:
        Dict containing phases and tasks
    """
    # Define 4 phases
    phases = [
        {"phaseId": 1, "name": "Fundamentals", "order": 1, "status": "in-progress"},
        {"phaseId": 2, "name": "Building Skills", "order": 2, "status": "locked"},
        {"phaseId": 3, "name": "Real Projects", "order": 3, "status": "locked"},
        {"phaseId": 4, "name": "Job Ready", "order": 4, "status": "locked"},
    ]

    # Generate tasks for each track
    # This is simplified; in production, you'd use an LLM to generate personalized tasks
    tasks = []

    # Learning track tasks
    learning_tasks = [
        {"title": f"Learn {career_name} Fundamentals", "phase": 1, "xp": 100},
        {"title": f"Advanced {career_name.split()[0]} Concepts", "phase": 2, "xp": 120},
        {"title": "Industry Best Practices", "phase": 2, "xp": 100},
        {"title": "Specialized Skills Deep Dive", "phase": 3, "xp": 150},
        {"title": "Expert-Level Mastery Course", "phase": 4, "xp": 200},
    ]

    for task in learning_tasks:
        tasks.append({
            "taskId": str(uuid.uuid4()),
            "title": task["title"],
            "track": "learning",
            "phase": task["phase"],
            "xp": task["xp"],
            "status": "not_started"
        })

    # Project track tasks
    project_tasks = [
        {"title": "Build a Beginner Portfolio Project", "phase": 1, "xp": 200},
        {"title": "Create an Intermediate Project", "phase": 2, "xp": 300},
        {"title": "Build a Real-World Application", "phase": 3, "xp": 500},
        {"title": "Contribute to Open Source or Client Work", "phase": 4, "xp": 600},
    ]

    for task in project_tasks:
        tasks.append({
            "taskId": str(uuid.uuid4()),
            "title": task["title"],
            "track": "projects",
            "phase": task["phase"],
            "xp": task["xp"],
            "status": "not_started"
        })

    # Networking track tasks
    networking_tasks = [
        {"title": "Join Professional Communities", "phase": 1, "xp": 50},
        {"title": "Attend Industry Events or Webinars", "phase": 2, "xp": 75},
        {"title": "Connect with 5 Professionals in the Field", "phase": 2, "xp": 100},
        {"title": "Schedule Informational Interviews", "phase": 3, "xp": 150},
        {"title": "Build Your Professional Network", "phase": 4, "xp": 100},
    ]

    for task in networking_tasks:
        tasks.append({
            "taskId": str(uuid.uuid4()),
            "title": task["title"],
            "track": "networking",
            "phase": task["phase"],
            "xp": task["xp"],
            "status": "not_started"
        })

    # Simulator track tasks
    simulator_tasks = [
        {"title": "Practice Interview Questions", "phase": 2, "xp": 100},
        {"title": "Mock Interview Simulation", "phase": 3, "xp": 150},
        {"title": "Real Job Application Process", "phase": 4, "xp": 200},
    ]

    for task in simulator_tasks:
        tasks.append({
            "taskId": str(uuid.uuid4()),
            "title": task["title"],
            "track": "simulator",
            "phase": task["phase"],
            "xp": task["xp"],
            "status": "not_started"
        })

    return {
        "phases": phases,
        "tasks": tasks
    }


def calculate_xp_for_level(level: int) -> int:
    """Calculate XP needed to reach the next level."""
    # Simple formula: 1000 * level
    return 1000 * level


def calculate_level_from_xp(xp: int) -> int:
    """Calculate current level from total XP."""
    # Simple formula: level = floor(xp / 1000) + 1
    return max(1, (xp // 1000) + 1)


def calculate_completion_percent(tasks: List[Dict[str, Any]]) -> float:
    """Calculate completion percentage based on tasks."""
    if not tasks:
        return 0.0

    completed = sum(1 for task in tasks if task.get("status") == "completed")
    return round((completed / len(tasks)) * 100, 1)
