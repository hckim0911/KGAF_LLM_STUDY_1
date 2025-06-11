import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
  api_key=os.environ.get("OPENAI_API_KEY"),
)

response = client.responses.create(
  model="gpt-4o-mini",
  input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)
