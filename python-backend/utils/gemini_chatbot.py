"""
Extended ChatBot with Gemini support for SpoonOS.
Adds Google Gemini integration to the base ChatBot class.
"""

import os
import logging
from typing import List, Optional, Union
import google.generativeai as genai
from spoon_ai.chat import ChatBot as BaseChatBot
from spoon_ai.schema import Message, LLMResponse

logger = logging.getLogger(__name__)


class GeminiChatBot(BaseChatBot):
    """
    Extended ChatBot that adds Gemini support to SpoonOS.
    Falls back to base ChatBot for openai and anthropic providers.
    """

    def __init__(self, model_name: str = "gemini-2.0-flash", llm_config: dict = None, llm_provider: str = "gemini", api_key: str = None):
        if llm_provider == "gemini" or llm_provider == "google":
            # Initialize Gemini-specific attributes
            self.llm_provider = llm_provider
            self.model_name = model_name
            self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            self.llm_config = llm_config
            self.output_index = 0

            # Configure Gemini
            genai.configure(api_key=self.api_key)
            self.llm = genai.GenerativeModel(model_name)
            logger.info(f"Initialized GeminiChatBot with model: {model_name}")
        else:
            # Use base ChatBot for openai/anthropic
            super().__init__(model_name=model_name, llm_config=llm_config, llm_provider=llm_provider, api_key=api_key)

    async def chat(self, prompt: str, system_msg: Optional[str] = None) -> LLMResponse:
        """
        Simple chat interface - sends a prompt and returns a response.
        This is the method used by our agents.

        Args:
            prompt: The user's message/prompt
            system_msg: Optional system message for context

        Returns:
            LLMResponse with content
        """
        if self.llm_provider in ["gemini", "google"]:
            # Gemini-specific implementation
            try:
                # Combine system message with prompt if provided
                full_prompt = f"{system_msg}\n\n{prompt}" if system_msg else prompt

                # Generate response using async executor to avoid blocking
                import asyncio
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self.llm.generate_content, full_prompt)

                logger.info(f"Gemini response received, length: {len(response.text)}")
                return LLMResponse(content=response.text, tool_calls=[])

            except Exception as e:
                logger.error(f"Gemini chat error: {e}", exc_info=True)
                raise
        else:
            # Use base ChatBot's ask method for openai/anthropic
            messages = [{"role": "user", "content": prompt}]
            content = await self.ask(messages=messages, system_msg=system_msg)
            return LLMResponse(content=content, tool_calls=[])

    async def ask(self, messages: List[Union[dict, Message]], system_msg: Optional[str] = None, output_queue = None) -> str:
        """
        Override ask method to support Gemini.
        """
        if self.llm_provider in ["gemini", "google"]:
            # Convert messages to Gemini format
            formatted_messages = []

            for msg in messages:
                if isinstance(msg, dict):
                    role = msg.get("role")
                    content = msg.get("content")
                elif isinstance(msg, Message):
                    role = msg.role
                    content = msg.content
                else:
                    continue

                # Gemini uses "user" and "model" roles
                if role == "assistant":
                    role = "model"
                elif role == "system":
                    # Prepend system message to first user message
                    if formatted_messages:
                        formatted_messages[0]["parts"][0] = f"{content}\n\n{formatted_messages[0]['parts'][0]}"
                    continue

                formatted_messages.append({
                    "role": role,
                    "parts": [content]
                })

            # Add system message if provided and no messages yet
            if system_msg and not any(msg.get("role") == "system" for msg in messages):
                if formatted_messages and formatted_messages[0]["role"] == "user":
                    formatted_messages[0]["parts"][0] = f"{system_msg}\n\n{formatted_messages[0]['parts'][0]}"

            # Generate response
            try:
                # Start chat session
                chat = self.llm.start_chat(history=formatted_messages[:-1] if len(formatted_messages) > 1 else [])

                # Send last message
                last_message = formatted_messages[-1]["parts"][0] if formatted_messages else ""
                response = chat.send_message(last_message)

                return response.text

            except Exception as e:
                logger.error(f"Gemini ask error: {e}", exc_info=True)
                raise
        else:
            # Use base implementation
            return await super().ask(messages=messages, system_msg=system_msg, output_queue=output_queue)
