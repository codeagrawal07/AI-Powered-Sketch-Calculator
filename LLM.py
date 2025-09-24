import base64
import io
from PIL import Image
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def process_image_with_llm(pil_image: Image.Image, user_prompt: str):
    """
    Analyzes an image using the Gemini 1.5 Flash model with a structured prompt.

    Args:
        pil_image: A Pillow Image object received from the Flask app.

    Returns:
        A string containing the AI's analysis of the image.
    """
    try:
        # 1. Initialize the Google Generative AI model
        # LangChain will automatically use the GOOGLE_API_KEY from your .env file
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

        # 2. Convert the Pillow Image object back to bytes, then to Base64
        # This is the format the API expects
        buffered = io.BytesIO()
        pil_image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        base_prompt = """You are a multimodal AI expert. Your primary task is to analyze the provided image
                         based on the user's specific request. If the request is generic, infer the user's intent.
                         - For math, solve it.
                         - For scenes, describe them.
                         - For objects, identify them."""
        # 3. Construct the multimodal message for the LLM
        # This message contains both text instructions and the image data
        message = HumanMessage(
               content=[
                {
                    "type": "text",
                    # **CHANGE**: Combine the base instructions with the user's specific prompt
                    "text": f"{base_prompt}\n\n**User's Request:** {user_prompt}",
                },
    
                {
                    "type": "image_url",
                    "image_url": f"data:image/png;base64,{img_base64}"
                },
            ]
        )
        
        # 4. Invoke the model with the structured message
        response = llm.invoke([message])
        
        return response.content

    except Exception as e:
        # This will print the detailed technical error to your Python terminal
        print(f"Error during LLM API call: {e}")
        return "Sorry, I couldn't process the image."