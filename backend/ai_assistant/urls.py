from django.urls import path
from .views import AskAIView, AIHistoryView, AIStatusView

urlpatterns = [
    path('ask/', AskAIView.as_view(), name='ai_ask'),
    path('history/', AIHistoryView.as_view(), name='ai_history'),
    path('status/', AIStatusView.as_view(), name='ai_status'),
]
