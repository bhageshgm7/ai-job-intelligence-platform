from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeSetActiveView,
    ResumeImproveView
)

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume_list_create'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<int:pk>/set-active/', ResumeSetActiveView.as_view(), name='resume_set_active'),
    path('<int:pk>/improve/', ResumeImproveView.as_view(), name='resume_improve'),
]
