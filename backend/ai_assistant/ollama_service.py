import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 90  # Generous timeout for local LLM inference

def get_ollama_config():
    """Retrieves current Ollama configuration from Django settings."""
    base_url = getattr(settings, 'OLLAMA_BASE_URL', '')
    if base_url:
        base_url = base_url.strip().rstrip('/')
    model = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:latest')
    return base_url, model

def check_ollama_status() -> dict:
    """
    Checks if the Ollama server is responsive and whether the configured model is installed.
    """
    base_url, configured_model = get_ollama_config()

    if not base_url:
        return {
            'available': False,
            'base_url': None,
            'configured_model': configured_model,
            'model_available': False,
            'available_models': [],
            'message': 'Ollama AI is not configured on this cloud instance. All deterministic skills matching and platform tracking features remain fully active.'
        }

    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get('name') for m in data.get('models', [])]
            # Check model match (with or without tag)
            model_found = any(
                configured_model == m or configured_model.split(':')[0] == m.split(':')[0]
                for m in models
            )
            return {
                'available': True,
                'base_url': base_url,
                'configured_model': configured_model,
                'model_available': model_found,
                'available_models': models,
                'message': 'Ollama service is online and ready.' if model_found else f"Model '{configured_model}' not found in Ollama. Available: {models}"
            }
        return {
            'available': False,
            'base_url': base_url,
            'configured_model': configured_model,
            'message': f"Ollama returned HTTP status {resp.status_code}."
        }
    except requests.exceptions.ConnectionError:
        return {
            'available': False,
            'base_url': base_url,
            'configured_model': configured_model,
            'message': f"Unable to connect to Ollama at {base_url}. Ensure the service is running (e.g., 'ollama serve')."
        }
    except Exception as exc:
        return {
            'available': False,
            'base_url': base_url,
            'configured_model': configured_model,
            'message': f"Health check error: {str(exc)}"
        }

def query_ollama(prompt: str, system_instruction: str = None, temperature: float = 0.4) -> dict:
    """
    Sends a generation prompt to the local Ollama instance.
    Returns:
        dict with keys: 'text', 'error', 'model', 'online'
    """
    base_url, model = get_ollama_config()

    if not base_url:
        return {
            'text': '',
            'error': 'Ollama AI is not configured on this cloud deployment. Deterministic resume-to-job matching and application tracking are fully active.',
            'model': model,
            'online': False
        }

    payload = {
        'model': model,
        'prompt': prompt,
        'stream': False,
        'options': {
            'temperature': temperature,
        }
    }
    if system_instruction:
        payload['system'] = system_instruction

    url = f"{base_url}/api/generate"

    try:
        logger.info(f"Dispatching query to Ollama at {url} using model '{model}'...")
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=TIMEOUT_SECONDS
        )

        if response.status_code == 200:
            result = response.json()
            generated_text = result.get('response', '').strip()
            return {
                'text': generated_text,
                'error': None,
                'model': model,
                'online': True
            }
        else:
            logger.warning(f"Ollama returned HTTP status {response.status_code}: {response.text}")
            return {
                'text': '',
                'error': f"Ollama returned HTTP {response.status_code}. Please verify model '{model}'.",
                'model': model,
                'online': False
            }

    except requests.exceptions.ConnectionError:
        logger.warning(f"Could not connect to Ollama at {base_url}.")
        return {
            'text': '',
            'error': f"Ollama connection refused at {base_url}. Ensure Ollama is running (`ollama serve`).",
            'model': model,
            'online': False
        }
    except requests.exceptions.Timeout:
        logger.warning(f"Ollama query timed out after {TIMEOUT_SECONDS}s.")
        return {
            'text': '',
            'error': f"AI generation timed out after {TIMEOUT_SECONDS} seconds.",
            'model': model,
            'online': False
        }
    except Exception as exc:
        logger.error(f"Unexpected error in Ollama service: {str(exc)}")
        return {
            'text': '',
            'error': f"AI processing error: {str(exc)}",
            'model': model,
            'online': False
        }
