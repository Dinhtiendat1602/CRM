from datetime import datetime

def log_user_message(session_id: str, message: str):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] 💬 [User - Session '{session_id}']: {message}")

def log_ai_reply(session_id: str, reply_length: int):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] 🤖 [Zen AI Reply - Session '{session_id}']: ({reply_length} ký tự)")

def log_tool_call(tool_name: str, args: dict):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] 🛠️ [Tool Executed]: {tool_name} with params={args}")

def log_error(context: str, error: Exception):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] ❌ [Error - {context}]: {str(error)}")

