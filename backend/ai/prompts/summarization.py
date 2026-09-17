"""
backend/ai/prompts/summarization.py

Prompts for conversation summarization.
"""

CONVERSATION_SUMMARY_PROMPT = """You are summarizing a payroll management conversation for future context retrieval.

Create a concise summary that captures:
1. User's main goals and questions
2. Key decisions made
3. Employee codes or names mentioned
4. Payroll periods discussed
5. Actions performed (updates, reports generated)
6. Unresolved issues or follow-up items
7. Important facts discovered

Keep the summary under 300 words. Focus on actionable information.
Exclude small talk and pleasantries.

Conversation to summarize:
{conversation}

Summary:"""

MEMORY_EXTRACTION_PROMPT = """From this conversation exchange, extract any IMPORTANT facts worth remembering.

Include:
- Specific employee decisions (rate changes, advance approvals)
- HR policy clarifications
- Recurring questions or issues
- Important payroll anomalies discovered
- User preferences stated

If nothing important was discussed, respond with: NOTHING_MEMORABLE

Exchange:
{exchange}

Important fact (or NOTHING_MEMORABLE):"""
