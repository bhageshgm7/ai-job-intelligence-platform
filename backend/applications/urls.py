from django.urls import path
from .views import ApplicationListCreateView, ApplicationDetailView

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application_list_create'),
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application_detail'),
]
