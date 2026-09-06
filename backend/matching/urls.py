from django.urls import path
from .views import AnalyzeMatchView, MatchHistoryView, MatchDetailView

urlpatterns = [
    path('analyze/', AnalyzeMatchView.as_view(), name='matching_analyze'),
    path('history/', MatchHistoryView.as_view(), name='matching_history'),
    path('<int:pk>/', MatchDetailView.as_view(), name='matching_detail'),
]
