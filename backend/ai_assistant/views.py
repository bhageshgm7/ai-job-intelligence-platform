from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AIConversation
from .serializers import AIConversationSerializer, AskQuestionSerializer
from .ollama_service import query_ollama, check_ollama_status
from .context_builder import build_user_career_context

class AskAIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data['question']

        # 1. Build context from user's live profile, active resume, applications, jobs, gaps
        user_context = build_user_career_context(request.user)

        system_instruction = (
            "You are an expert AI Career Coach, Senior Recruiter, and Technical Interview Strategist. "
            "You provide candidates with high-impact, actionable, practical, and empathetic career advice. "
            "Always tailor your advice based on their provided profile, target jobs, resume contents, and skill gaps.\n"
            "Format your answers with clean Markdown headings, bullet points, and code snippets when applicable."
        )

        full_prompt = f"""### CANDIDATE CONTEXT:
{user_context}

### USER QUESTION:
{question}

Provide a comprehensive, high-value, structured response addressing the user's question with respect to their actual context."""

        # 2. Query Ollama
        ai_res = query_ollama(full_prompt, system_instruction=system_instruction)

        if ai_res.get('error'):
            return Response({
                'error': ai_res['error'],
                'ai_status': 'offline',
                'question': question
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        answer = ai_res.get('text', '')

        # 3. Save conversation record
        conv = AIConversation.objects.create(
            user=request.user,
            question=question,
            answer=answer
        )

        return Response({
            'id': conv.id,
            'question': conv.question,
            'answer': conv.answer,
            'created_at': conv.created_at,
            'ai_status': 'online',
            'model': ai_res.get('model')
        }, status=status.HTTP_200_OK)


class AIHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = AIConversation.objects.filter(user=request.user).order_by('created_at')
        serializer = AIConversationSerializer(conversations, many=True)
        return Response(serializer.data)

    def delete(self, request):
        count, _ = AIConversation.objects.filter(user=request.user).delete()
        return Response({
            'message': f"Successfully cleared {count} conversation items."
        }, status=status.HTTP_200_OK)


class AIStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_info = check_ollama_status()
        return Response(status_info)
