import warnings
from google import genai
from config.settings import settings

# Bỏ qua các cảnh báo không quan trọng về môi trường
warnings.filterwarnings("ignore")

_client = None

def get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY không được tìm thấy trong file .env hoặc cấu hình!")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

