# Agent 3 (Analysis Agent) - Data Specification

## Overview
Agent 3 is the **Interview Analysis Agent** responsible for analyzing the entire interview session, including:
- The conversation between Agent 2 (Interviewer) and the Candidate
- The candidate's code/solution to the task created by Agent 1
- Time-based performance metrics
- Behavioral observations

This document specifies the exact data structure that Agent 3 must return for the Analytics Page to display.

---

## Complete Data Structure

### Main Response Schema

```typescript
interface InterviewAnalysis {
  // === Basic Information ===
  candidateId: string;              // Unique ID of the candidate
  candidateName: string;            // Full name
  position: string;                 // Job position they applied for
  interviewDate: string;            // ISO 8601 timestamp
  duration: number;                 // Total interview duration in minutes
  
  // === Technical Performance Scores (0-100) ===
  technicalScores: {
    codeQuality: number;            // Code organization, readability, best practices
    problemSolving: number;         // Approach to solving the problem
    algorithmicThinking: number;    // Algorithm design and efficiency
    debugging: number;              // Ability to find and fix bugs
    testing: number;                // Test coverage and quality
    edgeCaseHandling: number;       // Consideration of edge cases
    overall: number;                // Weighted average of above
  };
  
  // === Communication & Soft Skills (0-100) ===
  softSkills: {
    clarity: number;                // Clear communication
    questionAsking: number;         // Quality of questions asked
    thoughtProcess: number;         // Verbalization of thinking
    collaboration: number;          // Team-work approach
    responseToFeedback: number;     // How they handle feedback
    overall: number;                // Weighted average
  };
  
  // === Behavioral Indicators (0-100) ===
  behavioral: {
    stressHandling: number;         // Composure under pressure
    confidence: number;             // Self-assurance level
    learningAgility: number;        // Ability to learn quickly
    problemDecomposition: number;   // Breaking down complex problems
    criticalThinking: number;       // Analytical reasoning
  };
  
  // === Time Distribution Analysis ===
  timeAnalysis: {
    phases: Array<{
      name: string;                 // Phase name (e.g., "Understanding Requirements")
      duration: number;             // Duration in minutes
      percentage: number;           // Percentage of total time (0-100)
    }>;
    productivity: "high" | "medium" | "low";  // Overall productivity level
  };
  
  // === Key Insights ===
  insights: {
    strengths: string[];            // List of 3-5 key strengths
    improvements: string[];         // List of 3-5 areas to improve
    redFlags: string[];             // List of concerning issues (can be empty)
    notableMoments: Array<{
      type: "positive" | "negative";
      timestamp: string;            // Format: "HH:MM:SS"
      description: string;          // What happened
    }>;
  };
  
  // === Code Analysis ===
  codeAnalysis: {
    bestPractices: string[];        // List of good practices observed
    issues: string[];               // List of code issues found
    codeSnippets: Array<{
      type: "best" | "worst";       // Type of example
      code: string;                 // The actual code snippet
      explanation: string;          // Why it's good/bad
    }>;
  };
  
  // === Final Recommendation ===
  recommendation: {
    verdict: "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE" | "STRONG_NO_HIRE";
    confidence: number;             // Confidence level (0-100)
    summary: string;                // 2-3 sentence summary
    reasoning: string[];            // List of 3-5 key reasons
    fitForRole: number;             // Overall role fit score (0-100)
  };
  
  // === Task Information ===
  task: {
    title: string;                  // Task name
    difficulty: "easy" | "medium" | "hard";
    category: string;               // e.g., "Full-Stack Development"
    completed: boolean;             // Did they complete it?
  };
}
```

---

## Detailed Field Explanations

### 1. Technical Scores

**How to Calculate:**
- **codeQuality (0-100)**: Analyze code structure, naming conventions, comments, modularity
- **problemSolving (0-100)**: Evaluate the approach taken, creative solutions, logical flow
- **algorithmicThinking (0-100)**: Check time/space complexity, algorithm choice
- **debugging (0-100)**: Track how many bugs, how quickly they found them, debugging process
- **testing (0-100)**: Check if they wrote tests, test coverage, edge case testing
- **edgeCaseHandling (0-100)**: Did they consider null, empty, large inputs, etc.?
- **overall (0-100)**: Weighted average - suggest: `(codeQuality*0.25 + problemSolving*0.25 + algorithmicThinking*0.2 + debugging*0.15 + testing*0.1 + edgeCaseHandling*0.05)`

### 2. Soft Skills

**How to Analyze:**
- **clarity (0-100)**: Parse conversation transcripts - check for clear, concise explanations
- **questionAsking (0-100)**: Quality and relevance of questions asked by candidate
- **thoughtProcess (0-100)**: Did they explain their thinking while coding?
- **collaboration (0-100)**: Open to suggestions, interactive with interviewer
- **responseToFeedback (0-100)**: How did they react to hints/feedback?
- **overall (0-100)**: Average of all

### 3. Behavioral Indicators

**Observation-Based:**
- **stressHandling (0-100)**: Did they panic? Stayed calm during difficult moments?
- **confidence (0-100)**: Self-assured but not arrogant
- **learningAgility (0-100)**: Quickly adapted to new information
- **problemDecomposition (0-100)**: Broke down the problem into smaller parts
- **criticalThinking (0-100)**: Questioned assumptions, thought deeply

### 4. Time Analysis

**Phases** should include at least:
1. **Understanding Requirements** - Time spent reading/clarifying the task
2. **Planning & Design** - Architecture/pseudocode/planning time
3. **Implementation** - Actual coding time
4. **Testing & Debugging** - Finding and fixing bugs
5. **Discussion & Review** - Final discussion with interviewer

**Productivity Calculation:**
- **high**: Efficient use of time, minimal wasted effort
- **medium**: Some inefficiencies but generally productive
- **low**: Significant time wasted, struggling, going in circles

### 5. Insights

**Strengths** (3-5 items):
- Specific positive observations
- Example: "Excellent use of TypeScript generics for type safety"

**Improvements** (3-5 items):
- Constructive areas to work on
- Example: "Could improve error handling in edge cases"

**Red Flags** (0-5 items):
- Serious concerns
- Example: "Plagiarized code from online source", "Unable to explain own code"
- Can be empty array if no red flags

**Notable Moments**:
- Key positive or negative events during interview
- Include exact timestamp
- Max 5-10 moments

### 6. Code Analysis

**Best Practices** (list):
- Things they did well: "Used async/await properly", "Good separation of concerns"

**Issues** (list):
- Problems found: "No input validation", "Memory leak in loop"

**Code Snippets** (1-3 snippets):
- Show actual code examples
- Include brief explanation of why it's good or bad
- Keep snippets short (5-15 lines)

### 7. Recommendation

**Verdict Options:**
- **STRONG_HIRE**: Exceptional candidate, hire immediately
- **HIRE**: Good candidate, meets requirements well
- **MAYBE**: Borderline, needs more evaluation or consideration
- **NO_HIRE**: Does not meet requirements
- **STRONG_NO_HIRE**: Severe issues, definitely do not hire

**Confidence** (0-100):
- How confident is the AI in this recommendation?
- Based on clarity of signals, amount of data, consistency

**Summary**:
- 2-3 sentence executive summary of the candidate

**Reasoning** (3-5 bullet points):
- Clear, specific reasons supporting the verdict
- Reference actual performance metrics and observations

**Fit For Role** (0-100):
- Overall match with job requirements
- Consider technical skills, soft skills, and experience level

---

## Example API Response

```json
{
  "candidateId": "cand_123abc",
  "candidateName": "Sarah Anderson",
  "position": "Senior Full-Stack Developer",
  "interviewDate": "2025-12-10T14:30:00Z",
  "duration": 87,
  
  "technicalScores": {
    "codeQuality": 92,
    "problemSolving": 88,
    "algorithmicThinking": 85,
    "debugging": 90,
    "testing": 78,
    "edgeCaseHandling": 82,
    "overall": 86
  },
  
  "softSkills": {
    "clarity": 94,
    "questionAsking": 88,
    "thoughtProcess": 91,
    "collaboration": 89,
    "responseToFeedback": 95,
    "overall": 91
  },
  
  "behavioral": {
    "stressHandling": 87,
    "confidence": 90,
    "learningAgility": 93,
    "problemDecomposition": 89,
    "criticalThinking": 91
  },
  
  "timeAnalysis": {
    "phases": [
      {
        "name": "Understanding Requirements",
        "duration": 12,
        "percentage": 14
      },
      {
        "name": "Planning & Design",
        "duration": 18,
        "percentage": 21
      },
      {
        "name": "Implementation",
        "duration": 38,
        "percentage": 44
      },
      {
        "name": "Testing & Debugging",
        "duration": 15,
        "percentage": 17
      },
      {
        "name": "Discussion & Review",
        "duration": 4,
        "percentage": 4
      }
    ],
    "productivity": "high"
  },
  
  "insights": {
    "strengths": [
      "Exceptional code organization and use of TypeScript best practices",
      "Proactive in asking clarifying questions before implementation",
      "Strong debugging skills - quickly identified and fixed issues",
      "Clear communication of thought process throughout",
      "Good understanding of system design principles"
    ],
    "improvements": [
      "Could write more comprehensive unit tests",
      "Initial solution didn't consider mobile responsiveness",
      "Spent extra time refactoring - could optimize time management"
    ],
    "redFlags": [],
    "notableMoments": [
      {
        "type": "positive",
        "timestamp": "00:23:15",
        "description": "Identified a potential race condition before implementation and proposed a solution"
      },
      {
        "type": "positive",
        "timestamp": "00:45:30",
        "description": "Refactored code for better readability without being prompted"
      },
      {
        "type": "negative",
        "timestamp": "01:05:20",
        "description": "Initially missed edge case for empty array handling"
      }
    ]
  },
  
  "codeAnalysis": {
    "bestPractices": [
      "Used TypeScript interfaces for type safety",
      "Implemented proper error handling",
      "Followed SOLID principles",
      "Used meaningful variable names",
      "Added inline comments for complex logic"
    ],
    "issues": [
      "Missing error boundary for React component",
      "No input validation on user inputs",
      "Could optimize nested loops for better performance"
    ],
    "codeSnippets": [
      {
        "type": "best",
        "code": "const processData = async (items: DataItem[]): Promise<Result> => {\n  try {\n    return await items.reduce(async (acc, item) => {\n      const result = await acc;\n      const processed = await processItem(item);\n      return [...result, processed];\n    }, Promise.resolve([]));\n  } catch (error) {\n    logger.error('Data processing failed', error);\n    throw new ProcessingError('Failed to process items');\n  }\n};",
        "explanation": "Excellent use of async/reduce pattern with proper error handling and type safety"
      },
      {
        "type": "worst",
        "code": "for (let i = 0; i < data.length; i++) {\n  for (let j = 0; j < data[i].items.length; j++) {\n    // O(n²) complexity\n  }\n}",
        "explanation": "Could be optimized using Map or Set for O(n) complexity"
      }
    ]
  },
  
  "recommendation": {
    "verdict": "STRONG_HIRE",
    "confidence": 92,
    "summary": "Exceptional candidate with strong technical skills and excellent communication. Demonstrated senior-level problem-solving abilities and collaborative mindset.",
    "reasoning": [
      "Technical skills align perfectly with role requirements (86% technical score)",
      "Outstanding soft skills and communication (91% soft skills score)",
      "Proactive approach to identifying edge cases and potential issues",
      "Quick learner who adapts well to feedback",
      "Code quality and architecture decisions reflect senior-level experience"
    ],
    "fitForRole": 94
  },
  
  "task": {
    "title": "Build a Real-time Collaborative Task Manager",
    "difficulty": "hard",
    "category": "Full-Stack Development",
    "completed": true
  }
}
```

---

## Implementation Notes for Agent 3

### What Agent 3 Receives as Input:

```typescript
interface Agent3Input {
  // From Agent 1
  taskGenerated: {
    taskId: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    requirements: string[];
    testCases?: any[];
  };
  
  // From Agent 2 + Candidate Session
  interviewSession: {
    sessionId: string;
    candidateId: string;
    candidateName: string;
    position: string;
    startTime: string;
    endTime: string;
    
    // Full conversation transcript
    conversation: Array<{
      timestamp: string;
      speaker: "AI" | "CANDIDATE";
      message: string;
    }>;
    
    // Code submissions/changes
    codeHistory: Array<{
      timestamp: string;
      code: string;
      language: string;
      action: "write" | "edit" | "delete";
    }>;
    
    // Final submitted code
    finalCode: string;
    
    // Test results (if automated tests were run)
    testResults?: {
      passed: number;
      failed: number;
      total: number;
      details: any[];
    };
    
    // Any additional metadata
    metadata?: {
      codeExecutionAttempts?: number;
      errorsEncountered?: number;
      hintsGiven?: number;
    };
  };
}
```

### Agent 3 Processing Steps:

1. **Analyze Conversation**:
   - Use LLM to extract communication quality
   - Identify key moments (positive/negative)
   - Assess soft skills from dialogue

2. **Analyze Code**:
   - Run static code analysis
   - Check for best practices
   - Identify issues and anti-patterns
   - Extract notable code snippets

3. **Calculate Time Metrics**:
   - Parse timestamps from code history
   - Identify phases based on activity patterns
   - Calculate time distribution

4. **Generate Scores**:
   - Use combination of automated tools + LLM analysis
   - Normalize all scores to 0-100 scale

5. **Make Recommendation**:
   - Combine all metrics
   - Use LLM to generate verdict with reasoning
   - Calculate confidence based on data quality

6. **Structure Response**:
   - Format according to `InterviewAnalysis` interface
   - Ensure all required fields are present
   - Return as JSON

---

## API Endpoint Suggestion

```python
# Backend: FastAPI endpoint
@router.get("/api/interviews/{session_id}/analysis")
async def get_interview_analysis(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> InterviewAnalysis:
    """
    Get the AI-generated analysis for a completed interview session.
    This calls Agent 3 (Analysis Agent) to generate comprehensive insights.
    """
    # 1. Fetch interview session from DB
    # 2. Invoke Agent 3 with session data
    # 3. Return structured analysis
    pass
```

---

## Frontend Integration

The Analytics Page is already built to consume this exact data structure. No changes needed on frontend once Agent 3 returns data in this format.

```typescript
// Frontend: Fetch analysis
const analysis = await apiService.getInterviewAnalysis(sessionId);
// Pass to AnalyticsPage component
```

---

## Summary

**Agent 3 must return all fields defined in the `InterviewAnalysis` interface.**

Key responsibilities:
1. ✅ Analyze technical performance (code quality, problem-solving, etc.)
2. ✅ Evaluate communication & soft skills
3. ✅ Assess behavioral indicators
4. ✅ Track time distribution across interview phases
5. ✅ Identify strengths, improvements, red flags
6. ✅ Analyze code quality with specific examples
7. ✅ Provide final hiring recommendation with confidence level

The frontend is ready to display all this data in a comprehensive, visual analytics dashboard.
