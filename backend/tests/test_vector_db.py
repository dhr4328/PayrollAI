"""
backend/tests/test_vector_db.py

Unit tests for Vector Database session-scoped chat history.
"""

import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import vector_db
import database

def test_vector_db_workflow():
    # 1. Initialize DB
    database.init_db()
    vector_db.init_vector_db()

    session_id = "test_session_999"

    # Ensure clean initial state for test session
    vector_db.delete_session_history(session_id)
    initial_msgs = vector_db.get_session_messages(session_id)
    assert len(initial_msgs) == 0, "Initial session message count should be 0."

    # 2. Add messages to session
    msg1 = vector_db.add_chat_message(session_id, "msg-001", "user", "Show absent employees for November")
    assert msg1["session_id"] == session_id
    assert msg1["role"] == "user"

    msg2 = vector_db.add_chat_message(session_id, "msg-002", "assistant", "Here is the list of absent employees...")
    assert msg2["session_id"] == session_id
    assert msg2["role"] == "assistant"

    msg3 = vector_db.add_chat_message(session_id, "msg-003", "user", "Generate Form XXII register of advances")
    assert msg3["role"] == "user"

    # 3. Retrieve active session history
    session_msgs = vector_db.get_session_messages(session_id)
    assert len(session_msgs) == 3, f"Expected 3 messages, got {len(session_msgs)}"
    assert session_msgs[0]["content"] == "Show absent employees for November"
    assert session_msgs[2]["content"] == "Generate Form XXII register of advances"

    # 4. Perform vector similarity search
    results = vector_db.search_relevant_history(session_id, "advances", top_k=2)
    assert len(results) > 0, "Vector search should return relevant history"
    top_match = results[0]
    assert "advances" in top_match["content"].lower(), "Top vector match should contain 'advances'"
    assert "score" in top_match, "Vector match should include similarity score"

    # 5. User Logout -> Purge session vector history
    deleted_count = vector_db.delete_session_history(session_id)
    assert deleted_count == 3, f"Expected 3 deleted records on logout, got {deleted_count}"

    # 6. Confirm session history is completely removed
    post_logout_msgs = vector_db.get_session_messages(session_id)
    assert len(post_logout_msgs) == 0, "Post-logout session message count should be 0."

    print("SUCCESS: VectorDB session workflow test passed cleanly!")

if __name__ == "__main__":
    test_vector_db_workflow()
