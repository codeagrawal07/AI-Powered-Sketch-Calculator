import os
import io
from PIL import Image
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

load_dotenv()


def process_image_with_llm(pil_image: Image.Image, user_prompt: str):
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
      
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is missing from .env")

        # Convert image to PNG bytes
        buffer = io.BytesIO()
        pil_image.convert("RGB").save(buffer, format="PNG")
        image_bytes = buffer.getvalue()

        print("Image received:", pil_image.size)
        print("Image bytes:", len(image_bytes))

        # Use a Gemini model ID available to your API key.
        model = ChatGoogleGenerativeAI(
            model="gemini-3.8-flash",
            google_api_key=api_key,
            temperature=0
        )

        prompt = user_prompt.strip() if user_prompt else (
           """You are a multimodal AI expert. Your primary task is to analyze the provided image
                            based on the user's specific request. If the request is generic, infer the user's intent.
                          - For math, solve it.
                          - For scenes, describe them.
                          - For objects, identify them."""
        )

        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": (
                        "Carefully inspect the supplied image. "
                        "Read the handwriting, symbols, equations, "
                        "and diagrams before answering.\n\n"
                        f"User request: {prompt}"
                    )
                },
                {
                    "type": "image_url",
                    "image_url": (
                        "data:image/png;base64,"
                        + __import__("base64").b64encode(
                            image_bytes
                        ).decode("utf-8")
                    )
                }
            ]
        )

        response = model.invoke([message])
     
        if isinstance(response.content, str):
            return response.content

        return str(response.text) 

    except Exception as e:
        print("Image analysis failed:", repr(e))
        return f"Image analysis failed: {str(e)}"
